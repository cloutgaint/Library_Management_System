const pool = require("../config/db");

const getDashboardStatistics = async () => {
  const booksResult = await pool.query(`
    SELECT COUNT(*)::int AS total_books
    FROM books;
  `);

  const membersResult = await pool.query(`
    SELECT COUNT(*)::int AS total_members
    FROM members;
  `);

  const issuedResult = await pool.query(`
    SELECT COUNT(*)::int AS books_issued
    FROM borrow_transactions
    WHERE transaction_status = 'Issued';
  `);

  const returnedResult = await pool.query(`
    SELECT COUNT(*)::int AS books_returned
    FROM borrow_transactions
    WHERE transaction_status = 'Returned';
  `);

  const finesResult = await pool.query(`
    SELECT
      COALESCE(SUM(fine_amount), 0) AS total_fines,
      COALESCE(SUM(
        CASE
          WHEN payment_status = 'Paid' THEN fine_amount
          ELSE 0
        END
      ), 0) AS collected_fines,
      COALESCE(SUM(
        CASE
          WHEN payment_status != 'Paid' THEN fine_amount
          ELSE 0
        END
      ), 0) AS pending_fines
    FROM fines;
  `);

  return {
    totalBooks: booksResult.rows[0].total_books,
    totalMembers: membersResult.rows[0].total_members,
    booksIssued: issuedResult.rows[0].books_issued,
    booksReturned: returnedResult.rows[0].books_returned,
    totalFines: Number(finesResult.rows[0].total_fines),
    collectedFines: Number(finesResult.rows[0].collected_fines),
    pendingFines: Number(finesResult.rows[0].pending_fines),
  };
};

module.exports = {
  getDashboardStatistics,
};