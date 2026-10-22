const {
  getBookReviews,
  getBookRating,
  createReview,
  updateReview,
  deleteReview,
} = require("../models/reviewModel");

// Get reviews for a book
const getReviews = async (req, res) => {
  try {
    const { bookId } = req.params;

    const reviews = await getBookReviews(bookId);

    res.status(200).json(reviews);
  } catch (error) {
    console.error("Get Reviews Error:", error);

    res.status(500).json({
      message: "Failed to get reviews",
    });
  }
};

// Get rating summary
const getRating = async (req, res) => {
  try {
    const { bookId } = req.params;

    const rating = await getBookRating(bookId);

    res.status(200).json(rating);
  } catch (error) {
    console.error("Get Rating Error:", error);

    res.status(500).json({
      message: "Failed to get rating",
    });
  }
};

// Create review
const addReview = async (req, res) => {
  try {
    const { bookId, rating, reviewText } = req.body;
    const userId = req.user.id;

    if (!bookId || !rating) {
      return res.status(400).json({
        message: "Book ID and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const review = await createReview(
      bookId,
      userId,
      rating,
      reviewText || null
    );

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create Review Error:", error);

    if (error.code === "23505") {
      return res.status(400).json({
        message: "You have already reviewed this book",
      });
    }

    res.status(500).json({
      message: "Failed to create review",
    });
  }
};

// Update review
const editReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const review = await updateReview(
      id,
      userId,
      rating,
      reviewText || null
    );

    res.status(200).json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update Review Error:", error);

    res.status(404).json({
      message: error.message,
    });
  }
};

// Delete review
const removeReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await deleteReview(id, userId);

    res.status(200).json({
      message: "Review deleted successfully",
      review,
    });
  } catch (error) {
    console.error("Delete Review Error:", error);

    res.status(404).json({
      message: error.message,
    });
  }
};

module.exports = {
  getReviews,
  getRating,
  addReview,
  editReview,
  removeReview,
};