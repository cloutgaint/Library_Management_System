const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks,
  filterBooks,
  getBooksWithPagination,
} = require("../models/bookModel");

const getBookCoverFromISBN = (isbn) => {
  const cleanISBN = String(isbn || "").replace(/[^0-9Xx]/g, "");

  if (!cleanISBN) {
    return "";
  }

  return `https://covers.openlibrary.org/b/isbn/${cleanISBN}-L.jpg`;
};

// Get all books
const getBooks = async (req, res) => {
  try {
    const books = await getAllBooks();

    res.status(200).json({
      message: "Books fetched successfully",
      books,
    });
  } catch (error) {
    console.error("Get Books Error:", error);

    res.status(500).json({
      message: "Failed to fetch books",
    });
  }
};

// Get book by ID
const getBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await getBookById(id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book fetched successfully",
      book,
    });
  } catch (error) {
    console.error("Get Book Error:", error);

    res.status(500).json({
      message: "Failed to fetch book",
    });
  }
};

// Create book
const addBook = async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      category,
      status,
      description,
      image,
      total_copies,
      available_copies,
    } = req.body;

    if (!title || !author || !isbn || !category) {
      return res.status(400).json({
        message: "Title, author, ISBN and category are required",
      });
    }

    const coverImage =
      image?.trim() || getBookCoverFromISBN(isbn);

    const book = await createBook(
      title,
      author,
      isbn,
      category,
      status || "Available",
      description || "",
      coverImage,
      total_copies || 1,
      available_copies || 1
    );

    res.status(201).json({
      message: "Book created successfully",
      book,
    });
  } catch (error) {
    console.error("Create Book Error:", error);

    res.status(500).json({
      message: "Failed to create book",
    });
  }
};

// Update book
const editBook = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      author,
      isbn,
      category,
      status,
      description,
      image,
      total_copies,
      available_copies,
    } = req.body;

    const coverImage =
      image?.trim() || getBookCoverFromISBN(isbn);

    const book = await updateBook(
      id,
      title,
      author,
      isbn,
      category,
      status,
      description,
      coverImage,
      total_copies,
      available_copies
    );

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    console.error("Update Book Error:", error);

    res.status(500).json({
      message: "Failed to update book",
    });
  }
};

// Delete book
const removeBook = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await deleteBook(id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book deleted successfully",
      book,
    });
  } catch (error) {
    console.error("Delete Book Error:", error);

    res.status(500).json({
      message: "Failed to delete book",
    });
  }
};

// Search books
const searchBooksController = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const books = await searchBooks(query);

    res.status(200).json({
      message: "Books searched successfully",
      books,
    });
  } catch (error) {
    console.error("Search Books Error:", error);

    res.status(500).json({
      message: "Failed to search books",
    });
  }
};

// Filter books
const filterBooksController = async (req, res) => {
  try {
    const { category, status } = req.query;

    const books = await filterBooks(category, status);

    res.status(200).json({
      message: "Books filtered successfully",
      books,
    });
  } catch (error) {
    console.error("Filter Books Error:", error);

    res.status(500).json({
      message: "Failed to filter books",
    });
  }
};

// Pagination
const paginationBooksController = async (req, res) => {
  try {
    let { page, limit } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 5;

    if (page < 1 || limit < 1) {
      return res.status(400).json({
        message: "Page and limit must be greater than 0",
      });
    }

    const result = await getBooksWithPagination(page, limit);

    res.status(200).json({
      message: "Books fetched with pagination successfully",
      ...result,
    });
  } catch (error) {
    console.error("Pagination Error:", error);

    res.status(500).json({
      message: "Failed to fetch books with pagination",
    });
  }
};

module.exports = {
  getBooks,
  getBook,
  addBook,
  editBook,
  removeBook,
  searchBooksController,
  filterBooksController,
  paginationBooksController,
};