const express = require("express");
const router = express.Router();

const {
  getRecommendedBooks,
} = require("../controllers/recommendationController");

const authMiddleware = require("../middleware/authMiddleware");

router.get(
  "/",
  authMiddleware,
  getRecommendedBooks
);

module.exports = router;