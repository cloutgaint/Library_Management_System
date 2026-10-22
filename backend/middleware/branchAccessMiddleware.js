const { getAssignedBranchIds } = require("../models/userModel");

// Restricts librarians to their assigned branches. Admins have access to every
// branch; members never reach branch-scoped staff operations.
// `getBranchId` extracts the target branch id from the request.
const requireBranchAccess = (getBranchId) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (req.user.role === "admin") {
    return next();
  }

  if (req.user.role !== "librarian") {
    return res.status(403).json({ message: "Access denied. Insufficient permissions." });
  }

  const branchId = getBranchId(req);

  if (branchId === undefined || branchId === null || branchId === "") {
    return res.status(400).json({ message: "Branch is required" });
  }

  try {
    const assigned = await getAssignedBranchIds(req.user.id);

    if (!assigned.includes(String(branchId))) {
      return res.status(403).json({ message: "You are not assigned to this branch" });
    }

    next();
  } catch (error) {
    console.error("Branch access check failed:", error.message);
    return res.status(500).json({ message: "Unable to verify branch access" });
  }
};

const branchFromParams = (name = "branchId") => (req) => req.params[name];
const branchFromBody = (name = "branchId") => (req) => req.body?.[name];
const branchFromQuery = (name = "branchId") => (req) => req.query?.[name];

module.exports = {
  requireBranchAccess,
  branchFromParams,
  branchFromBody,
  branchFromQuery,
};
