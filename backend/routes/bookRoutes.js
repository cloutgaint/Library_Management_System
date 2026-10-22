const express = require("express");

const router = express.Router();

const {
  getBooks,
  getBook,
  addBook,
  editBook,
  removeBook,
  searchBooksController,
  filterBooksController,
  paginationBooksController,
} = require("../controllers/bookController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Get all books
router.get("/", authMiddleware, getBooks);

// Search books
router.get("/search", authMiddleware, searchBooksController);

// Filter books
router.get("/filter", authMiddleware, filterBooksController);

// Pagination
router.get(
  "/pagination",
  authMiddleware,
  paginationBooksController
);

// Get one book by ID
router.get("/:id", authMiddleware, getBook);

// Create a book - Admin only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  addBook
);

// Update a book - Admin only
router.put(
  "/:id",
  authMiddleware,
roleMiddleware("admin", "librarian"),
  editBook
);

// Delete a book - Admin only
router.delete(
  "/:id",
  authMiddleware,
 roleMiddleware("admin", "librarian"),
  removeBook
);

module.exports = router;