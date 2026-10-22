const pool = require("../config/db");

const getBookCoverFromISBN = async (isbn) => {
  try {
    const cleanISBN = String(isbn || "").replace(/[^0-9Xx]/g, "");

    if (!cleanISBN) {
      return "";
    }

    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`
    );

    if (!response.ok) {
      return "";
    }

    const data = await response.json();

    const imageUrl =
      data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail ||
      data.items?.[0]?.volumeInfo?.imageLinks?.smallThumbnail ||
      "";

    if (imageUrl) {
      return imageUrl.replace("http://", "https://");
    }

    return "";
  } catch (error) {
    console.error("Book Cover Fetch Error:", error);
    return "";
  }
};

const ensureBookCovers = async (books) => {
  for (const book of books) {
    if (!book.image && book.isbn) {
      const coverImage = await getBookCoverFromISBN(book.isbn);

      if (coverImage) {
        const result = await pool.query(
          `
          UPDATE books
          SET image = $1
          WHERE id = $2
          RETURNING image;
          `,
          [coverImage, book.id]
        );

        book.image = result.rows[0]?.image || coverImage;
      }
    }
  }

  return books;
};

// Get all books
const getAllBooks = async () => {
  const query = `
    SELECT *
    FROM books
    ORDER BY id ASC;
  `;

  const result = await pool.query(query);

  return await ensureBookCovers(result.rows);
};

// Get book by ID
const getBookById = async (id) => {
  const query = `
    SELECT *
    FROM books
    WHERE id = $1;
  `;

  const result = await pool.query(query);

  if (!result.rows[0]) {
    return null;
  }

  const books = await ensureBookCovers(result.rows);

  return books[0];
};

// Create book
const createBook = async (
  title,
  author,
  isbn,
  category,
  status,
  description,
  image,
  total_copies,
  available_copies
) => {
  const query = `
    INSERT INTO books
    (
      title,
      author,
      isbn,
      category,
      status,
      description,
      image,
      total_copies,
      available_copies
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    title,
    author,
    isbn,
    category,
    status,
    description,
    image,
    total_copies,
    available_copies,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// Update book
const updateBook = async (
  id,
  title,
  author,
  isbn,
  category,
  status,
  description,
  image,
  total_copies,
  available_copies
) => {
  const query = `
    UPDATE books
    SET
      title = $1,
      author = $2,
      isbn = $3,
      category = $4,
      status = $5,
      description = $6,
      image = $7,
      total_copies = $8,
      available_copies = $9
    WHERE id = $10
    RETURNING *;
  `;

  const values = [
    title,
    author,
    isbn,
    category,
    status,
    description,
    image,
    total_copies,
    available_copies,
    id,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

// Delete book
const deleteBook = async (id) => {
  const query = `
    DELETE FROM books
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};

// Search books
const searchBooks = async (query) => {
  const sql = `
    SELECT *
    FROM books
    WHERE
      title ILIKE $1
      OR author ILIKE $1
      OR isbn ILIKE $1
    ORDER BY id ASC;
  `;

  const result = await pool.query(sql, [`%${query}%`]);

  return await ensureBookCovers(result.rows);
};

// Filter books
const filterBooks = async (category, status) => {
  let query = "SELECT * FROM books WHERE 1=1";
  const values = [];
  let parameterIndex = 1;

  if (category) {
    query += ` AND category = $${parameterIndex}`;
    values.push(category);
    parameterIndex++;
  }

  if (status) {
    query += ` AND status = $${parameterIndex}`;
    values.push(status);
    parameterIndex++;
  }

  query += " ORDER BY id ASC";

  const result = await pool.query(query, values);

  return await ensureBookCovers(result.rows);
};

// Pagination
const getBooksWithPagination = async (page, limit) => {
  const offset = (page - 1) * limit;

  const booksQuery = `
    SELECT *
    FROM books
    ORDER BY id ASC
    LIMIT $1
    OFFSET $2;
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM books;
  `;

  const booksResult = await pool.query(booksQuery, [limit, offset]);
  const countResult = await pool.query(countQuery);

  const books = await ensureBookCovers(booksResult.rows);

  const totalBooks = Number(countResult.rows[0].total);
  const totalPages = Math.ceil(totalBooks / limit);

  return {
    books,
    currentPage: page,
    limit,
    totalBooks,
    totalPages,
  };
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
  filterBooks,
  getBooksWithPagination,
};