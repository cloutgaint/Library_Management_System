const {
  getAllEbooks,
  getEbookById,
  createEbook,
  deleteEbook,
} = require("../models/ebookModel");
const pool = require("../config/db");


// Get all e-books
const getEbooks = async (req, res) => {
  try {
    let ebooks;
    if (req.user.role === "member") {
      const result = await pool.query(
        `SELECT e.id, e.book_id, e.title, e.author, e.created_at, b.isbn,
                (e.file_url LIKE 'private-ebook:%') AS has_file
         FROM ebooks e
         JOIN books b ON b.id = e.book_id
         WHERE EXISTS (
           SELECT 1 FROM borrow_transactions bt
           JOIN members m ON m.id = bt.member_id
           WHERE m.user_id = $1 AND bt.book_id = e.book_id
             AND bt.transaction_status = 'Issued' AND bt.return_date IS NULL
         )
         ORDER BY e.created_at DESC`,
        [req.user.id]
      );
      ebooks = result.rows;
    } else if (["admin", "librarian"].includes(req.user.role)) {
      ebooks = await getAllEbooks();
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json({
      message: "E-books fetched successfully",
      ebooks,
    });
  } catch (error) {
    console.error("Get E-books Error:", error);

    res.status(500).json({
      message: "Failed to fetch e-books",
    });
  }
};


// Get e-book by ID
const getEbook = async (req, res) => {
  try {
    const { id } = req.params;

    const ebook = await getEbookById(id);

    res.status(200).json({
      message: "E-book fetched successfully",
      ebook,
    });
  } catch (error) {
    console.error("Get E-book Error:", error);

    if (error.message === "E-book not found") {
      return res.status(404).json({
        message: "E-book not found",
      });
    }

    res.status(500).json({
      message: "Failed to fetch e-book",
    });
  }
};


// Create e-book
const addEbook = async (req, res) => {
  try {
    const {
      bookId,
      title,
      author,
      fileUrl,
    } = req.body;

    if (!bookId || !title || !author || !fileUrl) {
      return res.status(400).json({
        message: "bookId, title, author and fileUrl are required",
      });
    }

    const ebook = await createEbook(
      bookId,
      title,
      author,
      fileUrl
    );

    res.status(201).json({
      message: "E-book created successfully",
      ebook,
    });
  } catch (error) {
    console.error("Create E-book Error:", error);

    res.status(500).json({
      message: "Failed to create e-book",
    });
  }
};


// Delete e-book
const removeEbook = async (req, res) => {
  try {
    const { id } = req.params;

    const ebook = await deleteEbook(id);

    res.status(200).json({
      message: "E-book deleted successfully",
      ebook,
    });
  } catch (error) {
    console.error("Delete E-book Error:", error);

    if (error.message === "E-book not found") {
      return res.status(404).json({
        message: "E-book not found",
      });
    }

    res.status(500).json({
      message: "Failed to delete e-book",
    });
  }
};


module.exports = {
  getEbooks,
  getEbook,
  addEbook,
  removeEbook,
};