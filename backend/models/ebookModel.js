const pool = require("../config/db");

const getAllEbooks = async () => {
  const result = await pool.query(`
    SELECT
      e.id,
      e.book_id,
      e.title,
      e.author,
      e.file_url,
      e.created_at,
      b.isbn
    FROM ebooks e
    LEFT JOIN books b ON e.book_id = b.id
    ORDER BY e.created_at DESC;
  `);

  return result.rows;
};

const getEbookById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      e.id,
      e.book_id,
      e.title,
      e.author,
      e.file_url,
      e.created_at,
      b.isbn
    FROM ebooks e
    LEFT JOIN books b ON e.book_id = b.id
    WHERE e.id = $1;
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("E-book not found");
  }

  return result.rows[0];
};

const createEbook = async (bookId, title, author, fileUrl) => {
  const result = await pool.query(
    `
    INSERT INTO ebooks
    (
      book_id,
      title,
      author,
      file_url
    )
    VALUES
    ($1, $2, $3, $4)
    RETURNING *;
    `,
    [bookId, title, author, fileUrl]
  );

  return result.rows[0];
};

const deleteEbook = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM ebooks
    WHERE id = $1
    RETURNING *;
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error("E-book not found");
  }

  return result.rows[0];
};

module.exports = {
  getAllEbooks,
  getEbookById,
  createEbook,
  deleteEbook,
};