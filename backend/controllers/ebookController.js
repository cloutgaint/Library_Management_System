const {
  getAllEbooks,
  getEbookById,
  createEbook,
  deleteEbook,
} = require("../models/ebookModel");


// Get all e-books
const getEbooks = async (req, res) => {
  try {
    const ebooks = await getAllEbooks();

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