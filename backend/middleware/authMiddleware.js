const jwt = require("jsonwebtoken");
const { findAuthUserById } = require("../models/userModel");

// Verifies the bearer token, then loads the account from the database so the
// role, activation state and password version come from the server, never the client.
const authMiddleware = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");

  if (!req.headers.authorization) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Invalid authorization format",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }

  try {
    const user = decoded?.id ? await findAuthUserById(decoded.id) : null;

    if (!user || !user.is_active) {
      return res.status(401).json({
        message: "Session is no longer valid. Please log in again.",
      });
    }

    // Password changes and deactivation bump session_version, revoking older tokens.
    if (decoded.sv !== user.session_version) {
      return res.status(401).json({
        message: "Session is no longer valid. Please log in again.",
      });
    }

    req.user = {
      id: String(user.id),
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);

    return res.status(500).json({
      message: "Unable to verify session",
    });
  }
};

module.exports = authMiddleware;
