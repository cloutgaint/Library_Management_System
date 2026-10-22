const express = require("express");
const cors = require("cors");
require("dotenv").config({ quiet: true });

const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const memberRoutes = require("./routes/memberRoutes");
const borrowTransactionRoutes = require("./routes/borrowTransactionRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const fineRoutes = require("./routes/fineRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();
const {securityHeaders}=require("./middleware/securityMiddleware");
const qrRoutes = require("./routes/qrRoutes");
const ebookRoutes = require("./routes/ebookRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const requisitionRoutes = require("./routes/requisitionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const roleDashboardRoutes = require("./routes/roleDashboardRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const userManagementRoutes = require("./routes/userManagementRoutes");
const branchRoutes = require("./routes/branchRoutes");
const origins=(process.env.CORS_ORIGINS||"http://localhost:5173,http://127.0.0.1:5173").split(",").map(x=>x.trim()).filter(Boolean);
app.use(cors({origin:(origin,cb)=>cb(null,!origin||origins.includes(origin)),credentials:false}));
app.use(securityHeaders);
app.use(express.json({limit:"1mb"}));
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
app.use("/api/requisitions", requisitionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard-overview", roleDashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userManagementRoutes);
app.use("/api/branches", branchRoutes);

module.exports = app;
