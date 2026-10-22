const QRCode = require("qrcode");

// Generate QR code
const generateQRCode = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        message: "QR data is required",
      });
    }

    const qrCode = await QRCode.toDataURL(data);

    res.status(200).json({
      message: "QR code generated successfully",
      data,
      qrCode,
    });
  } catch (error) {
    console.error("QR Code Error:", error);

    res.status(500).json({
      message: "Failed to generate QR code",
    });
  }
};

module.exports = {
  generateQRCode,
};