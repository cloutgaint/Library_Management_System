const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const {
  normalizeEmail,
  validateEmail,
  validateFullName,
  validatePassword,
  toPublicUser,
} = require("../services/accountPolicy");

const {
  hashToken,
  isWellFormedToken,
  sendAccountLink,
} = require("../services/accountTokenService");

const {
  createMemberAccount,
  emailExists,
  findUserForLogin,
  getAssignedBranches,
} = require("../models/userModel");

const BCRYPT_ROUNDS = 12;
const INVALID_CREDENTIALS = "Invalid email or password";
const RESET_REQUEST_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

// Compared against when the email is unknown, so response time does not reveal whether an account exists.
let dummyHashPromise;
const dummyHash = () => (dummyHashPromise ??= bcrypt.hash("not-a-real-password", BCRYPT_ROUNDS));

// Public self-registration: always creates a Member account.
const register = async (req, res) => {
  try {
    const { full_name, email, password, confirm_password, role } = req.body || {};

    // Privileged roles are assigned by the Admin; a request naming one is rejected outright.
    if (role !== undefined && role !== "member") {
      return res.status(403).json({
        message: "Only member accounts can be self-registered",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const errors = {};

    const nameError = validateFullName(full_name);
    const emailError = validateEmail(normalizedEmail);
    const passwordError = validatePassword(password);

    if (nameError) errors.full_name = nameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    if (!confirm_password) {
      errors.confirm_password = "Confirm password is required";
    } else if (password !== confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({
        message: Object.values(errors)[0],
        errors,
      });
    }

    if (await emailExists(normalizedEmail)) {
      return res.status(409).json({
        message: "An account with this email already exists",
        errors: { email: "An account with this email already exists" },
      });
    }

    const user = await createMemberAccount({
      fullName: full_name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    });

    res.status(201).json({
      message: "Registration successful. You can now log in.",
      user: toPublicUser(user),
    });
  } catch (error) {
    // A concurrent registration with the same email loses the unique-index race.
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists",
        errors: { email: "An account with this email already exists" },
      });
    }

    console.error("Registration Error:", error.message);

    res.status(500).json({
      message: "Registration Failed",
    });
  }
};

// One login for every role: the role comes from the database record.
const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await findUserForLogin(email);
    const isMatch = await bcrypt.compare(password, user ? user.password : await dummyHash());

    if (!user || !isMatch) {
      return res.status(401).json({
        message: INVALID_CREDENTIALS,
      });
    }

    // Revealed only after the password is proven, so it does not disclose account existence.
    if (!user.is_active) {
      return res.status(403).json({
        message: "This account has been deactivated. Contact the library administrator.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        sv: user.session_version,
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error.message);

    res.status(500).json({
      message: "Login Failed",
    });
  }
};

// Returns the authenticated account as the database currently has it.
const me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email, role, is_active, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = toPublicUser(rows[0]);

    if (user.role === "librarian") {
      user.branches = await getAssignedBranches(user.id);
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Current User Error:", error.message);

    res.status(500).json({ message: "Unable to load account" });
  }
};

// Always responds with the same message so the endpoint cannot be used to discover accounts.
const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (validateEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (!process.env.RESET_URL_BASE) {
      console.error("Password reset requested but RESET_URL_BASE is not configured");
      return res.status(503).json({
        message: "Password recovery is temporarily unavailable.",
      });
    }

    const user = await findUserForLogin(email);

    // Deactivated accounts cannot sign in, so they are not sent reset links.
    if (user && user.is_active) {
      await sendAccountLink(user, "reset");
    }

    return res.status(200).json({ message: RESET_REQUEST_MESSAGE });
  } catch (error) {
    console.error("Forgot Password Error:", error.message);

    return res.status(500).json({
      message: "Unable to process password reset request",
    });
  }
};

// Completes both password resets and staff invitations.
const confirmPasswordReset = async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (!isWellFormedToken(token)) {
    return res.status(400).json({ message: "Invalid or expired reset link" });
  }

  const passwordError = validatePassword(newPassword);

  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT t.id, t.user_id FROM password_reset_tokens t
       JOIN users u ON u.id = t.user_id AND u.is_active
       WHERE t.token_hash=$1 AND used_at IS NULL AND expires_at>NOW()
       FOR UPDATE OF t`,
      [hashToken(token)]
    );

    const resetToken = tokenResult.rows[0];

    if (!resetToken) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Bumping session_version revokes every session issued before this change.
    await client.query(
      "UPDATE users SET password=$1, password_changed_at=NOW(), session_version=session_version+1, updated_at=NOW() WHERE id=$2",
      [hashedPassword, resetToken.user_id]
    );

    // Consume this token and any other outstanding tokens for the same user.
    await client.query(
      "UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL",
      [resetToken.user_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Password updated successfully. You can now log in.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Reset Password Error:", error.message);

    return res.status(500).json({ message: "Unable to reset password" });
  } finally {
    client.release();
  }
};

module.exports = {
  register,
  login,
  me,
  forgotPassword,
  confirmPasswordReset,
};
