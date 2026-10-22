const {
  getBorrowingHistoryByMember,
  getAllBorrowTransactions,
  issueBook,
  returnBook,
  renewBook,
} = require("../models/borrowTransactionModel");

const {
  createNotification,
} = require("../models/notificationModel");

const pool = require("../config/db");

// Get borrowing history of logged-in member
const getMyBorrowingHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberQuery = `
      SELECT id
      FROM members
      WHERE user_id = $1;
    `;

    const memberResult = await pool.query(memberQuery, [userId]);

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        message: "Member profile not found",
      });
    }

    const memberId = memberResult.rows[0].id;

    const history = await getBorrowingHistoryByMember(memberId);

    res.status(200).json({
      message: "Borrowing history fetched successfully",
      history,
    });
  } catch (error) {
    console.error("Get My Borrowing History Error:", error);

    res.status(500).json({
      message: "Failed to fetch borrowing history",
    });
  }
};

// Get borrowing history of a specific member
const getMemberBorrowingHistory = async (req, res) => {
  try {
    const { memberId } = req.params;

    const history = await getBorrowingHistoryByMember(memberId);

    res.status(200).json({
      message: "Member borrowing history fetched successfully",
      history,
    });
  } catch (error) {
    console.error("Get Member Borrowing History Error:", error);

    res.status(500).json({
      message: "Failed to fetch member borrowing history",
    });
  }
};

// Get all borrowing transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await getAllBorrowTransactions();

    res.status(200).json({
      message: "Borrowing transactions fetched successfully",
      transactions,
    });
  } catch (error) {
    console.error("Get All Transactions Error:", error);

    res.status(500).json({
      message: "Failed to fetch borrowing transactions",
    });
  }
};

// Issue a book
const issueBookController = async (req, res) => {
  try {
    const { memberId, bookId, dueDate } = req.body;

    if (!memberId || !bookId || !dueDate) {
      return res.status(400).json({
        message: "memberId, bookId and dueDate are required",
      });
    }

    const result = await issueBook(
      memberId,
      bookId,
      dueDate
    );

    const bookResult = await pool.query(
      `
      SELECT title
      FROM books
      WHERE id = $1;
      `,
      [bookId]
    );

    const memberResult = await pool.query(
      `
      SELECT user_id
      FROM members
      WHERE id = $1;
      `,
      [memberId]
    );

    const bookTitle =
      bookResult.rows[0]?.title || "the selected book";

    const userId = memberResult.rows[0]?.user_id;

    if (userId) {
      await createNotification(
        userId,
        "Issue",
        "Book Issued",
        `The book "${bookTitle}" has been issued to you.`
      );
    }

    res.status(201).json({
      message: "Book issued successfully",
      transaction: result.transaction,
    });
  } catch (error) {
    console.error("Issue Book Error:", error);

    if (error.message === "Book not found") {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    if (error.message === "Book is not available") {
      return res.status(400).json({
        message: "Book is not available",
      });
    }

    res.status(500).json({
      message: "Failed to issue book",
    });
  }
};

// Return a book
const returnBookController = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        message: "transactionId is required",
      });
    }

    const transaction = await returnBook(transactionId);

    const transactionResult = await pool.query(
      `
      SELECT
        bt.member_id,
        b.title
      FROM borrow_transactions bt
      JOIN books b ON bt.book_id = b.id
      WHERE bt.id = $1;
      `,
      [transactionId]
    );

    const transactionData = transactionResult.rows[0];

    if (transactionData) {
      const memberResult = await pool.query(
        `
        SELECT user_id
        FROM members
        WHERE id = $1;
        `,
        [transactionData.member_id]
      );

      const userId = memberResult.rows[0]?.user_id;

      if (userId) {
        await createNotification(
          userId,
          "Return",
          "Book Returned",
          `The book "${transactionData.title}" has been returned successfully.`
        );
      }
    }

    res.status(200).json({
      message: "Book returned successfully",
      transaction,
    });
  } catch (error) {
    console.error("Return Book Error:", error);

    if (error.message === "Transaction not found") {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    if (error.message === "Book already returned") {
      return res.status(400).json({
        message: "Book already returned",
      });
    }

    res.status(500).json({
      message: "Failed to return book",
    });
  }
};

// Renew a book
const renewBookController = async (req, res) => {
  try {
    const { transactionId, newDueDate } = req.body;

    if (!transactionId || !newDueDate) {
      return res.status(400).json({
        message: "transactionId and newDueDate are required",
      });
    }

    const transaction = await renewBook(
      transactionId,
      newDueDate
    );

    const transactionResult = await pool.query(
      `
      SELECT
        bt.member_id,
        b.title
      FROM borrow_transactions bt
      JOIN books b ON bt.book_id = b.id
      WHERE bt.id = $1;
      `,
      [transactionId]
    );

    const transactionData = transactionResult.rows[0];

    if (transactionData) {
      const memberResult = await pool.query(
        `
        SELECT user_id
        FROM members
        WHERE id = $1;
        `,
        [transactionData.member_id]
      );

      const userId = memberResult.rows[0]?.user_id;

      if (userId) {
        await createNotification(
          userId,
          "Renewal",
          "Book Renewed",
          `The book "${transactionData.title}" has been renewed successfully.`
        );
      }
    }

    res.status(200).json({
      message: "Book renewed successfully",
      transaction,
    });
  } catch (error) {
    console.error("Renew Book Error:", error);

    if (
      error.message ===
      "Transaction not found or book already returned"
    ) {
      return res.status(404).json({
        message:
          "Transaction not found or book already returned",
      });
    }

    res.status(500).json({
      message: "Failed to renew book",
    });
  }
};

module.exports = {
  getMyBorrowingHistory,
  getMemberBorrowingHistory,
  getAllTransactions,
  issueBookController,
  returnBookController,
  renewBookController,
};