const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const controller = require("../controllers/userManagementController");

router.use(authMiddleware);

// Librarian management is reserved for the Admin.
const adminOnly = roleMiddleware("admin");

router.get("/librarians", adminOnly, controller.getLibrarians);
router.post("/librarians", adminOnly, controller.addLibrarian);
router.get("/librarians/:id", adminOnly, controller.getLibrarian);
router.patch("/librarians/:id", adminOnly, controller.editLibrarian);
router.patch("/librarians/:id/status", adminOnly, controller.changeLibrarianStatus);
router.put("/librarians/:id/branches", adminOnly, controller.setLibrarianBranches);
router.post("/librarians/:id/password-link", adminOnly, controller.sendLibrarianPasswordLink);

// Staff may create member accounts on a member's behalf.
router.post("/members", roleMiddleware("admin", "librarian"), controller.addMemberAccount);

module.exports = router;
