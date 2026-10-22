const express = require("express");

const router = express.Router();

const { generateQRCode } = require("../controllers/qrController");

const authMiddleware = require("../middleware/authMiddleware");


// Generate QR code
router.post(
  "/generate",
  authMiddleware,
  generateQRCode
);


module.exports = router;