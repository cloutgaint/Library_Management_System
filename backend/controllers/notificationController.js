const {
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  createDueDateReminders,
  createOverdueNotifications,
  createLowStockNotifications,
} = require("../models/notificationModel");
const { sendEmail } = require("../services/emailService");

// Get user's notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await getUserNotifications(userId);

    res.status(200).json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);

    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};


// Create notification
const addNotification = async (req, res) => {
  try {
    const { userId, type, title, message } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        message: "userId, type, title and message are required",
      });
    }

    const notification = await createNotification(
      userId,
      type,
      title,
      message
    );

    res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Create Notification Error:", error);

    res.status(500).json({
      message: "Failed to create notification",
    });
  }
};


// Mark notification as read
const readNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await markNotificationAsRead(id);

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark Notification Error:", error);

    if (error.message === "Notification not found") {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
};


// Create due-date reminders
const dueDateReminders = async (req, res) => {
  try {
    const transactions = await createDueDateReminders();
     for (const transaction of transactions) {
  if (transaction.email) {
    await sendEmail(
      transaction.email,
      "Library Due-Date Reminder",
      `Reminder: Your borrowed book is due soon. Please return it on time to avoid fines.`
    );
  }
}
    res.status(200).json({
      message: "Due-date reminders created successfully",
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Due Date Reminder Error:", error);

    res.status(500).json({
      message: "Failed to create due-date reminders",
    });
  }
};


// Create overdue notifications
const overdueNotifications = async (req, res) => {
  try {
    const transactions = await createOverdueNotifications();

    res.status(200).json({
      message: "Overdue notifications created successfully",
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Overdue Notification Error:", error);

    res.status(500).json({
      message: "Failed to create overdue notifications",
    });
  }
};


// Create low-stock notifications
const lowStockNotifications = async (req, res) => {
  try {
    const books = await createLowStockNotifications();

    res.status(200).json({
      message: "Low-stock notifications created successfully",
      count: books.length,
      books,
    });
  } catch (error) {
    console.error("Low Stock Notification Error:", error);

    res.status(500).json({
      message: "Failed to create low-stock notifications",
    });
  }
};


module.exports = {
  getNotifications,
  addNotification,
  readNotification,
  dueDateReminders,
  overdueNotifications,
  lowStockNotifications,
};