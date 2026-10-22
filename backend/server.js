const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/db");

const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const memberRoutes = require("./routes/memberRoutes");
const borrowTransactionRoutes = require("./routes/borrowTransactionRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const fineRoutes = require("./routes/fineRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const qrRoutes = require("./routes/qrRoutes");
const ebookRoutes = require("./routes/ebookRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Authentication routes
app.use("/api/auth", authRoutes);

// Book routes
app.use("/api/books", bookRoutes);

// Member routes
app.use("/api/members", memberRoutes);

// Borrowing transaction routes
app.use("/api/borrow-transactions", borrowTransactionRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/fines", fineRoutes);
// Home route
app.get("/", (req, res) => {
  res.send("🚀 Library Management Backend is Running...");
});
app.use("/api/notifications", notificationRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});