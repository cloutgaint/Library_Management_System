// Shared validation rules for account creation, password changes and logins.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const ROLES = ["admin", "librarian", "member"];

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const validateEmail = (email) => {
  if (!email) return "Email is required";
  if (email.length > 255 || !EMAIL_PATTERN.test(email)) return "Enter a valid email address";
  return null;
};

const validateFullName = (fullName) => {
  const name = typeof fullName === "string" ? fullName.trim() : "";
  if (!name) return "Full name is required";
  if (name.length > 150) return "Full name must be 150 characters or fewer";
  return null;
};

const validatePassword = (password) => {
  if (typeof password !== "string" || !password) return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number";
  }
  return null;
};

const dashboardPathForRole = (role) =>
  ({ admin: "/admin", librarian: "/librarian", member: "/student" })[role] || "/";

// The only user fields ever returned by the API; never includes the password hash.
const toPublicUser = (user) =>
  user && {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  };

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  ROLES,
  normalizeEmail,
  validateEmail,
  validateFullName,
  validatePassword,
  dashboardPathForRole,
  toPublicUser,
};
