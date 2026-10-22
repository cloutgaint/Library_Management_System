const pool = require("../config/db");

// Get all notifications for a user
const getUserNotifications = async (userId) => {
  const query = `
    SELECT *
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query, [userId]);

  return result.rows;
};

// Create notification
const createNotification = async (
  userId,
  type,
  title,
  message
) => {
  const query = `
    INSERT INTO notifications
    (
      user_id,
      type,
      title,
      message
    )
    VALUES
    ($1, $2, $3, $4)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    userId,
    type,
    title,
    message,
  ]);

  return result.rows[0];
};

// Mark notification as read
const markNotificationAsRead = async (notificationId) => {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [notificationId]);

  if (result.rows.length === 0) {
    throw new Error("Notification not found");
  }

  return result.rows[0];
};

// Create due-date reminder notifications
const createDueDateReminders = async () => {
  const query = `
    SELECT
      bt.id AS transaction_id,
      m.user_id,
      u.email,
      b.title,
      bt.due_date
    FROM borrow_transactions bt
    JOIN members m ON bt.member_id = m.id
    JOIN users u ON m.user_id = u.id
    JOIN books b ON bt.book_id = b.id
    WHERE bt.transaction_status = 'Issued'
      AND bt.due_date = CURRENT_DATE + INTERVAL '3 days';
  `;

  const result = await pool.query(query);

  for (const transaction of result.rows) {
    await createNotification(
      transaction.user_id,
      "Due Date Reminder",
      "Book Due Soon",
      `Your book "${transaction.title}" is due in 3 days.`
    );
  }

  return result.rows;
};

// Create overdue notifications
const createOverdueNotifications = async () => {
  const query = `
    SELECT
      bt.id AS transaction_id,
      m.user_id,
      b.title,
      bt.due_date
    FROM borrow_transactions bt
    JOIN members m ON bt.member_id = m.id
    JOIN books b ON bt.book_id = b.id
    WHERE bt.transaction_status = 'Issued'
      AND bt.due_date < CURRENT_DATE;
  `;

  const result = await pool.query(query);

  for (const transaction of result.rows) {
    await createNotification(
      transaction.user_id,
      "Overdue",
      "Book Overdue",
      `Your book "${transaction.title}" is overdue. Please return it.`
    );
  }

  return result.rows;
};

// Create low-stock notifications
const createLowStockNotifications = async () => {
  const query = `
    SELECT
      b.id AS book_id,
      b.title,
      b.available_copies,
      u.id AS user_id
    FROM books b
    CROSS JOIN users u
    WHERE b.available_copies = 1
      AND u.role IN ('admin', 'librarian');
  `;

  const result = await pool.query(query);

  for (const book of result.rows) {
    await createNotification(
      book.user_id,
      "Low Stock",
      "Low Book Stock",
      `The book "${book.title}" has only 1 copy available.`
    );
  }

  return result.rows;
};

module.exports = {
  getUserNotifications,
  createNotification,
  markNotificationAsRead,
  createDueDateReminders,
  createOverdueNotifications,
  createLowStockNotifications,
};