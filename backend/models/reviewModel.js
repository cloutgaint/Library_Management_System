const pool = require("../config/db");

// Get all reviews for a book
const getBookReviews = async (bookId) => {
  const query = `
    SELECT
      reviews.id,
      reviews.book_id,
      reviews.user_id,
      users.full_name,
      reviews.rating,
      reviews.review_text,
      reviews.created_at
    FROM reviews
    JOIN users
      ON reviews.user_id = users.id
    WHERE reviews.book_id = $1
    ORDER BY reviews.created_at DESC;
  `;

  const result = await pool.query(query, [bookId]);

  return result.rows;
};

// Get rating summary for a book
const getBookRating = async (bookId) => {
  const query = `
    SELECT
      COUNT(*) AS review_count,
      COALESCE(ROUND(AVG(rating), 1), 0) AS average_rating
    FROM reviews
    WHERE book_id = $1;
  `;

  const result = await pool.query(query, [bookId]);

  return result.rows[0];
};

// Create a review
const createReview = async (bookId, userId, rating, reviewText) => {
  const query = `
    INSERT INTO reviews
    (
      book_id,
      user_id,
      rating,
      review_text
    )
    VALUES
    ($1, $2, $3, $4)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    bookId,
    userId,
    rating,
    reviewText,
  ]);

  return result.rows[0];
};

// Update a review
const updateReview = async (reviewId, userId, rating, reviewText) => {
  const query = `
    UPDATE reviews
    SET
      rating = $1,
      review_text = $2
    WHERE id = $3
      AND user_id = $4
    RETURNING *;
  `;

  const result = await pool.query(query, [
    rating,
    reviewText,
    reviewId,
    userId,
  ]);

  if (result.rows.length === 0) {
    throw new Error("Review not found or unauthorized");
  }

  return result.rows[0];
};

// Delete a review
const deleteReview = async (reviewId, userId) => {
  const query = `
    DELETE FROM reviews
    WHERE id = $1
      AND user_id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [reviewId, userId]);

  if (result.rows.length === 0) {
    throw new Error("Review not found or unauthorized");
  }

  return result.rows[0];
};

module.exports = {
  getBookReviews,
  getBookRating,
  createReview,
  updateReview,
  deleteReview,
};