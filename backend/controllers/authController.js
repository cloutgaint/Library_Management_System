const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const pool = require("../config/db");
const {sendEmail} = require("../services/emailService");
const jwt = require("jsonwebtoken");

const {
  createUser,
  createUserWithMember,
  findUserByEmail,
  updatePassword,
} = require("../models/userModel");

const register = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    // Public registration can only create members; privileged roles are assigned by admins.
    if (role !== undefined && role !== "member") {
      return res.status(403).json({
        message: "Only member accounts can be self-registered",
      });
    }

    const selectedRole = "member";

    const hashedPassword = await bcrypt.hash(password, 12);

    let user;

    if (selectedRole === "member") {
      user = await createUserWithMember(
        full_name,
        email,
        hashedPassword,
        selectedRole
      );
    } else {
      user = await createUser(
        full_name,
        email,
        hashedPassword,
        selectedRole
      );
    }

    res.status(201).json({
      message: "User Registered Successfully",
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      message: "Registration Failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Login Failed",
    });
  }
};

const RESET_TOKEN_TTL_MINUTES = 30;
const RESET_REQUEST_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Always responds with the same message so the endpoint cannot be used to discover accounts.
const forgotPassword = async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!process.env.RESET_URL_BASE) {
      console.error("Password reset requested but RESET_URL_BASE is not configured");
      return res.status(503).json({
        message: "Password recovery is temporarily unavailable.",
      });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(200).json({ message: RESET_REQUEST_MESSAGE });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + make_interval(mins => $3))`,
      [user.id, hashResetToken(token), RESET_TOKEN_TTL_MINUTES]
    );

    // Token travels in the URL fragment so it is never sent to servers or logged in access logs.
    const resetLink = `${process.env.RESET_URL_BASE}#token=${token}`;

    await sendEmail(
      user.email,
      "Reset your library account password",
      `A password reset was requested for your library account.\n\n` +
        `Use this link within ${RESET_TOKEN_TTL_MINUTES} minutes to choose a new password:\n${resetLink}\n\n` +
        `If you did not request this, you can ignore this email.`
    );

    return res.status(200).json({ message: RESET_REQUEST_MESSAGE });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      message: "Unable to process password reset request",
    });
  }
};

const confirmPasswordReset = async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ message: "Invalid or expired reset link" });
  }

  if (
    typeof newPassword !== "string" ||
    newPassword.length < 10 ||
    newPassword.length > 128
  ) {
    return res.status(400).json({
      message: "Password must be between 10 and 128 characters",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tokenResult = await client.query(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash=$1 AND used_at IS NULL AND expires_at>NOW()
       FOR UPDATE`,
      [hashResetToken(token)]
    );

    const resetToken = tokenResult.rows[0];

    if (!resetToken) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await client.query("UPDATE users SET password=$1 WHERE id=$2", [
      hashedPassword,
      resetToken.user_id,
    ]);

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
    console.error("Reset Password Error:", error);

    return res.status(500).json({ message: "Unable to reset password" });
  } finally {
    client.release();
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  confirmPasswordReset,
};