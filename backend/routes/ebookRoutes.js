const express = require("express");

const multer = require("multer");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { getBookById } = require("../models/bookModel");
const { createEbook, getEbookById } = require("../models/ebookModel");
const privateDir = path.resolve(__dirname, "../private-ebooks");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } }).single("ebookFile");
const validFile = (file) => {
  if (!file) return false;
  const ext = path.extname(file.originalname).toLowerCase();
  return (ext === ".pdf" && file.buffer.subarray(0, 5).toString() === "%PDF-") ||
    (ext === ".epub" && file.buffer.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4])));
};

const router = express.Router();

const {
  getEbooks,
  getEbook,
  addEbook,
  removeEbook,
} = require("../controllers/ebookController");

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

// Get all e-books
router.get("/", authMiddleware, getEbooks);


// Store uploaded content outside public/static directories.
router.post("/upload", authMiddleware, roleMiddleware("admin", "librarian"), (req, res) => {
  upload(req, res, async (uploadError) => {
    if (uploadError) return res.status(400).json({ message: uploadError.message });
    if (!validFile(req.file)) return res.status(400).json({ message: "Select a valid PDF or EPUB (maximum 25 MB)." });
    const bookId = Number(req.body.bookId);
    if (!Number.isSafeInteger(bookId) || bookId <= 0) return res.status(400).json({ message: "Valid book ID required." });
    let storedPath;
    try {
      const book = await getBookById(bookId);
      if (!book) return res.status(404).json({ message: "Book not found." });
      const filename = crypto.randomUUID() + path.extname(req.file.originalname).toLowerCase();
      await fs.mkdir(privateDir, { recursive: true, mode: 0o700 });
      storedPath = path.join(privateDir, filename);
      await fs.writeFile(storedPath, req.file.buffer, { flag: "wx", mode: 0o600 });
      const ebook = await createEbook(bookId, book.title, book.author, "private-ebook:" + filename);
      return res.status(201).json({ message: "E-book uploaded.", ebook });
    } catch (error) {
      if (storedPath) await fs.unlink(storedPath).catch(() => {});
      console.error("E-book upload failed:", error);
      return res.status(500).json({ message: "E-book upload failed." });
    }
  });
});

router.get("/:id/read", authMiddleware, async (req, res) => {
  try {
    const ebook = await getEbookById(req.params.id);
    const match = /^private-ebook:([a-f0-9-]{36})\\.(pdf|epub)$/.exec(ebook.file_url || "");
    if (!match) return res.status(404).json({ message: "No uploaded file available." });
    const filename = match[1] + "." + match[2];
    const file = await fs.readFile(path.join(privateDir, filename));
    res.set("Content-Type", match[2] === "pdf" ? "application/pdf" : "application/epub+zip");
    res.set("Content-Disposition", 'inline; filename="' + filename + '"');
    res.set("Cache-Control", "private, no-store");
    return res.send(file);
  } catch (error) {
    if (error.code === "ENOENT" || error.message === "E-book not found") return res.status(404).json({ message: "File not found." });
    console.error("E-book read failed:", error);
    return res.status(500).json({ message: "Unable to read e-book." });
  }
});

// Get one e-book by ID
router.get("/:id", authMiddleware, getEbook);

// Create an e-book - Admin/Librarian
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  addEbook
);

// Delete an e-book - Admin/Librarian
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  removeEbook
);

module.exports = router;