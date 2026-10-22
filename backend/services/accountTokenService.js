const crypto = require("node:crypto");
const pool = require("../config/db");
const { sendEmail } = require("./emailService");

// Reset links are short-lived; invitations give new staff time to respond.
const TOKEN_TTL_MINUTES = { reset: 30, invite: 72 * 60 };

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const isWellFormedToken = (token) =>
  typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

const resetLinkFor = (token) => {
  if (!process.env.RESET_URL_BASE) {
    throw new Error("RESET_URL_BASE is not configured");
  }

  // Token travels in the URL fragment so it is never sent to servers or logged in access logs.
  return `${process.env.RESET_URL_BASE}#token=${token}`;
};

// Stores only the token hash. Returns the raw token, which must never be logged.
const issueAccountToken = async (userId, purpose, db = pool) => {
  const token = crypto.randomBytes(32).toString("hex");

  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, $3, NOW() + make_interval(mins => $4))`,
    [userId, hashToken(token), purpose, TOKEN_TTL_MINUTES[purpose]]
  );

  return token;
};

const revokeOutstandingTokens = (userId, db = pool) =>
  db.query(
    "UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL",
    [userId]
  );

const emailContent = (purpose, user, link) => {
  const minutes = TOKEN_TTL_MINUTES[purpose];

  if (purpose === "invite") {
    return {
      subject: "You have been invited to the Library Management System",
      text:
        `Hello ${user.full_name},\n\n` +
        `A ${user.role} account has been created for you. ` +
        `Use this link within ${minutes / 60} hours to choose your password:\n${link}\n\n` +
        `If you were not expecting this, you can ignore this email.`,
    };
  }

  return {
    subject: "Reset your library account password",
    text:
      `A password reset was requested for your library account.\n\n` +
      `Use this link within ${minutes} minutes to choose a new password:\n${link}\n\n` +
      `If you did not request this, you can ignore this email.`,
  };
};

// Revokes earlier links, issues a new token and emails it.
// Resolves to true when the email was sent and false when delivery failed.
const sendAccountLink = async (user, purpose) => {
  await revokeOutstandingTokens(user.id);
  const token = await issueAccountToken(user.id, purpose);
  const { subject, text } = emailContent(purpose, user, resetLinkFor(token));

  try {
    await sendEmail(user.email, subject, text);
    return true;
  } catch {
    console.error(`Account ${purpose} email could not be delivered for user ${user.id}`);
    return false;
  }
};

module.exports = {
  TOKEN_TTL_MINUTES,
  hashToken,
  isWellFormedToken,
  issueAccountToken,
  revokeOutstandingTokens,
  sendAccountLink,
};
