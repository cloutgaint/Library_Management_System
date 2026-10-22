const express = require("express");
const router = express.Router();

const {
  getReviews,
  getRating,
  addReview,
  editReview,
  removeReview,
  moderate,
} = require("../controllers/reviewController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Get all reviews for a book
router.get(
  "/book/:bookId",
  authMiddleware,
  getReviews
);

// Get rating summary
router.get(
  "/book/:bookId/rating",
  authMiddleware,
  getRating
);

// Create review - members
router.post(
  "/",
  authMiddleware,
  roleMiddleware("member"),
  addReview
);

// Update review
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("member"),
  editReview
);

// Delete review
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("member"),
  removeReview
);

router.patch("/:id/moderation", authMiddleware, roleMiddleware("admin", "librarian"), moderate);

module.exports = router;