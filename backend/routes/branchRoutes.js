const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { requireBranchAccess, branchFromParams } = require("../middleware/branchAccessMiddleware");
const { getAssignedBranchIds } = require("../models/userModel");
const { listBranches, getBranchById, createBranch, updateBranch } = require("../models/branchModel");

router.use(authMiddleware, roleMiddleware("admin", "librarian"));

const isPositiveId = (value) => /^[1-9]\d{0,17}$/.test(String(value));

const fail = (res, error, message) => {
  if (error.code === "23505") {
    return res.status(409).json({ message: "A branch with this code already exists" });
  }

  console.error(`${message}:`, error.message);
  return res.status(500).json({ message });
};

// Librarians see only the branches they are assigned to.
router.get("/", async (req, res) => {
  try {
    const branchIds = req.user.role === "admin" ? null : await getAssignedBranchIds(req.user.id);
    res.json({ branches: await listBranches({ branchIds }) });
  } catch (error) {
    fail(res, error, "Failed to fetch branches");
  }
});

router.get(
  "/:branchId",
  (req, res, next) => (isPositiveId(req.params.branchId) ? next() : res.status(400).json({ message: "Invalid branch id" })),
  requireBranchAccess(branchFromParams("branchId")),
  async (req, res) => {
    try {
      const branch = await getBranchById(req.params.branchId);

      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      res.json({ branch });
    } catch (error) {
      fail(res, error, "Failed to fetch branch");
    }
  }
);

// Branch management is an Admin operation.
router.post("/", roleMiddleware("admin"), async (req, res) => {
  const { code, name, address } = req.body || {};

  if (typeof code !== "string" || !code.trim() || code.trim().length > 32) {
    return res.status(400).json({ message: "Branch code is required (max 32 characters)" });
  }

  if (typeof name !== "string" || !name.trim() || name.trim().length > 160) {
    return res.status(400).json({ message: "Branch name is required (max 160 characters)" });
  }

  try {
    const branch = await createBranch({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      address: typeof address === "string" ? address.trim() : "",
    });

    res.status(201).json({ message: "Branch created", branch });
  } catch (error) {
    fail(res, error, "Failed to create branch");
  }
});

router.patch("/:branchId", roleMiddleware("admin"), async (req, res) => {
  if (!isPositiveId(req.params.branchId)) {
    return res.status(400).json({ message: "Invalid branch id" });
  }

  const { name, address, is_active } = req.body || {};

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({ message: "Branch name cannot be empty" });
  }

  if (is_active !== undefined && typeof is_active !== "boolean") {
    return res.status(400).json({ message: "is_active must be true or false" });
  }

  try {
    const branch = await updateBranch(req.params.branchId, {
      name: name?.trim(),
      address: typeof address === "string" ? address.trim() : undefined,
      isActive: is_active,
    });

    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }

    res.json({ message: "Branch updated", branch });
  } catch (error) {
    fail(res, error, "Failed to update branch");
  }
});

module.exports = router;
