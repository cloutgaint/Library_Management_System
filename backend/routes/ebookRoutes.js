const express = require("express");

const router = express.Router();

const {
  getEbooks,
  getEbook,
  addEbook,
  removeEbook,
} = require("../controllers/ebookController");

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

// Get all e-books
router.get("/", authMiddleware, getEbooks);

// Get one e-book by ID
router.get("/:id", authMiddleware, getEbook);

// Create an e-book - Admin/Librarian
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  addEbook
);

// Delete an e-book - Admin/Librarian
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  removeEbook
);

module.exports = router;