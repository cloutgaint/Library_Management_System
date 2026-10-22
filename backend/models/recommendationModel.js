const pool = require("../config/db");

// Get recommended books for a user
const getRecommendations = async (userId) => {
  const query = `
    SELECT
      b.id,
      b.title,
      b.author,
      b.isbn,
      b.category,
      b.status,
      b.description,
      b.image,
      b.total_copies,
      b.available_copies
    FROM books b
    WHERE b.category IN (
      SELECT DISTINCT b2.category
      FROM books b2
      JOIN borrow_transactions bt
        ON b2.id = bt.book_id
      JOIN members m
        ON bt.member_id = m.id
      WHERE m.user_id = $1
    )
    AND b.id NOT IN (
      SELECT bt2.book_id
      FROM borrow_transactions bt2
      JOIN members m2
        ON bt2.member_id = m2.id
      WHERE m2.user_id = $1
    )
    ORDER BY b.created_at DESC;
  `;

  const result = await pool.query(query, [userId]);

  return result.rows;
};

module.exports = {
  getRecommendations,
};