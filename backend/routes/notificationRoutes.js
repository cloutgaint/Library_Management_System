const express = require("express");

const router = express.Router();

const {
  getNotifications,
  addNotification,
  readNotification,
  dueDateReminders,
  overdueNotifications,
  lowStockNotifications,
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// Get logged-in user's notifications
router.get(
  "/",
  authMiddleware,
  getNotifications
);


// Create notification - Admin/Librarian
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  addNotification
);


// Mark notification as read
router.put(
  "/:id/read",
  authMiddleware,
  readNotification
);


// Create due-date reminders - Admin/Librarian
router.post(
  "/due-reminders",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  dueDateReminders
);


// Create overdue notifications - Admin/Librarian
router.post(
  "/overdue",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  overdueNotifications
);


// Create low-stock notifications - Admin/Librarian
router.post(
  "/low-stock",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  lowStockNotifications
);


module.exports = router;