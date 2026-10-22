const express = require("express");

const router = express.Router();

const {
  getMyBorrowingHistory,
  getMemberBorrowingHistory,
  getAllTransactions,
  issueBookController,
  returnBookController,
  renewBookController,
} = require("../controllers/borrowTransactionController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Logged-in member's borrowing history
router.get(
  "/my-history",
  authMiddleware,
  roleMiddleware("member"),
  getMyBorrowingHistory
);

// Specific member's borrowing history
router.get(
  "/member/:memberId",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getMemberBorrowingHistory
);

// All borrowing transactions
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getAllTransactions
);

// Issue a book
router.post(
  "/issue",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  issueBookController
);

// Return a book
router.post(
  "/return",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  returnBookController
);

// Renew a book
router.put(
  "/renew",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  renewBookController
);

module.exports = router;