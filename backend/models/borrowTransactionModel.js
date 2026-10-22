const pool = require("../config/db");

const getBorrowingHistoryByMember = async (memberId) => {
  const query = `
    SELECT
      bt.id,
      bt.member_id,
      bt.book_id,
      b.title,
      b.author,
      b.isbn,
      bt.issue_date,
      bt.due_date,
      bt.return_date,
      bt.transaction_status,
      bt.created_at
    FROM borrow_transactions bt
    JOIN books b ON bt.book_id = b.id
    WHERE bt.member_id = $1
    ORDER BY bt.issue_date DESC;
  `;

  const result = await pool.query(query, [memberId]);

  return result.rows;
};

const getAllBorrowTransactions = async () => {
  const query = `
    SELECT
      bt.id,
      bt.member_id,
      m.user_id,
      u.full_name,
      u.email,
      bt.book_id,
      b.title,
      b.author,
      b.image,

      bt.issue_date,
      bt.due_date,
      bt.return_date,
      bt.transaction_status,
      bt.created_at
    FROM borrow_transactions bt
    JOIN members m ON bt.member_id = m.id
    JOIN users u ON m.user_id = u.id
    JOIN books b ON bt.book_id = b.id
    ORDER BY bt.issue_date DESC;
  `;

  const result = await pool.query(query);

  return result.rows;
};

const issueBook = async (memberId, bookId, dueDate) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const memberResult = await client.query(
      `SELECT id, membership_status, membership_expiry >= CURRENT_DATE AS is_current
       FROM members WHERE id = $1 FOR UPDATE;`,
      [memberId]
    );
    if (!memberResult.rows.length) throw new Error("Member not found");
    const member = memberResult.rows[0];
    if (member.membership_status !== "Active" ||
        !member.is_current) {
      throw new Error("Membership is not active");
    }

    const bookResult = await client.query(
      `
      SELECT id, title, available_copies
      FROM books
      WHERE id = $1
      FOR UPDATE;
      `,
      [bookId]
    );

    if (bookResult.rows.length === 0) {
      throw new Error("Book not found");
    }

    const book = bookResult.rows[0];

    if (book.available_copies <= 0) {
      throw new Error("Book is not available");
    }

    const transactionResult = await client.query(
      `
      INSERT INTO borrow_transactions
      (
        member_id,
        book_id,
        issue_date,
        due_date,
        transaction_status
      )
      VALUES
      ($1, $2, CURRENT_DATE, $3, 'Issued')
      RETURNING *;
      `,
      [memberId, bookId, dueDate]
    );

    await client.query(
      `
      UPDATE books
      SET
        available_copies = available_copies - 1,
        status = CASE
          WHEN available_copies - 1 <= 0 THEN 'Issued'
          ELSE 'Available'
        END
      WHERE id = $1;
      `,
      [bookId]
    );

    await client.query("COMMIT");

    return {
      transaction: transactionResult.rows[0],
      book,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const returnBook = async (transactionId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const transactionResult = await client.query(
      `
      SELECT id, book_id, transaction_status
      FROM borrow_transactions
      WHERE id = $1
      FOR UPDATE;
      `,
      [transactionId]
    );

    if (transactionResult.rows.length === 0) {
      throw new Error("Transaction not found");
    }

    const transaction = transactionResult.rows[0];

    if (transaction.transaction_status === "Returned") {
      throw new Error("Book already returned");
    }

    const updatedTransaction = await client.query(
      `
      UPDATE borrow_transactions
      SET
        return_date = CURRENT_DATE,
        transaction_status = 'Returned'
      WHERE id = $1
      RETURNING *;
      `,
      [transactionId]
    );

    await client.query(
      `
      UPDATE books
      SET
        available_copies = available_copies + 1,
        status = 'Available'
      WHERE id = $1;
      `,
      [transaction.book_id]
    );

    await client.query("COMMIT");

    return updatedTransaction.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const renewBook = async (transactionId, newDueDate) => {
  const query = `
    UPDATE borrow_transactions
    SET due_date = $1, renewal_count = renewal_count + 1
    WHERE id = $2
      AND transaction_status = 'Issued'
      AND renewal_count < (SELECT max_renewals FROM circulation_policy WHERE id = 1)
      AND $1::date > GREATEST(CURRENT_DATE, due_date)
      AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.book_id = borrow_transactions.book_id AND r.status IN ('Waiting','Ready') AND r.member_id <> borrow_transactions.member_id)
    RETURNING *;
  `;

  const result = await pool.query(query, [
    newDueDate,
    transactionId,
  ]);

  if (result.rows.length === 0) {
    throw new Error("Transaction not found or book already returned");
  }

  return result.rows[0];
};

module.exports = {
  getBorrowingHistoryByMember,
  getAllBorrowTransactions,
  issueBook,
  returnBook,
  renewBook,
};