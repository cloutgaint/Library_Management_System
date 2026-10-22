const express = require("express");

const router = express.Router();

const {
  getBorrowingReportController,
} = require("../controllers/reportController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/borrowing",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getBorrowingReportController
);

module.exports = router;
