const pool = require("../config/db");

const calculateFine = async (transactionId) => {
  const transactionResult = await pool.query(
    `
    SELECT
      id,
      member_id,
      book_id,
      due_date,
      return_date,
      transaction_status
    FROM borrow_transactions
    WHERE id = $1;
    `,
    [transactionId]
  );

  if (transactionResult.rows.length === 0) {
    throw new Error("Transaction not found");
  }

  const transaction = transactionResult.rows[0];

  const result = await pool.query(
    `SELECT GREATEST(0, COALESCE($1::date, CURRENT_DATE) - $2::date)::integer AS overdue_days,
            COALESCE((SELECT fine_per_day FROM circulation_policy WHERE id = 1), 5.00) AS rate`,
    [transaction.return_date, transaction.due_date]
  );
  const overdueDays = result.rows[0].overdue_days;
  const fineRatePerDay = Number(result.rows[0].rate);
  const fineAmount = overdueDays * fineRatePerDay;

  return {
    transaction_id: transaction.id,
    member_id: transaction.member_id,
    overdue_days: overdueDays,
    fine_rate_per_day: fineRatePerDay,
    fine_amount: fineAmount,
  };
};

const createOrUpdateFine = async (transactionId) => {
  const fine = await calculateFine(transactionId);

  const existingFine = await pool.query(
    `
    SELECT id, payment_status
    FROM fines
    WHERE transaction_id = $1;
    `,
    [transactionId]
  );

  if (existingFine.rows.length > 0) {
    if (existingFine.rows[0].payment_status === "Paid") {
      const paid = await getFineById(existingFine.rows[0].id);
      return paid;
    }
    const result = await pool.query(
      `
      UPDATE fines
      SET fine_amount = $1
      WHERE transaction_id = $2
      RETURNING *;
      `,
      [fine.fine_amount, transactionId]
    );

    return result.rows[0];
  }

  const result = await pool.query(
    `
    INSERT INTO fines
    (
      transaction_id,
      member_id,
      fine_amount,
      payment_status
    )
    VALUES
    ($1, $2, $3, 'Unpaid')
    RETURNING *;
    `,
    [transactionId, fine.member_id, fine.fine_amount]
  );

  return result.rows[0];
};

const getAllFines = async () => {
  const result = await pool.query(
    `
    SELECT
      f.id,
      f.transaction_id,
      f.member_id,
      u.full_name,
      u.email,
      f.fine_amount,
      f.payment_status,
      f.payment_date,
      f.created_at
    FROM fines f
    JOIN members m ON f.member_id = m.id
    JOIN users u ON m.user_id = u.id
    ORDER BY f.created_at DESC;
    `
  );

  return result.rows;
};

const getMyFines = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      f.id,
      f.transaction_id,
      f.member_id,
      u.full_name,
      u.email,
      f.fine_amount,
      f.payment_status,
      f.payment_date,
      f.created_at
    FROM fines f
    JOIN members m ON f.member_id = m.id
    JOIN users u ON m.user_id = u.id
    WHERE m.user_id = $1
    ORDER BY f.created_at DESC;
    `,
    [userId]
  );

  return result.rows;
};

const getFineById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      f.id,
      f.transaction_id,
      f.member_id,
      u.full_name,
      u.email,
      f.fine_amount,
      f.payment_status,
      f.payment_date,
      f.created_at
    FROM fines f
    JOIN members m ON f.member_id = m.id
    JOIN users u ON m.user_id = u.id
    WHERE f.id = $1;
    `,
    [id]
  );

  return result.rows[0];
};

const payFine = async (fineId, userId, userRole) => {
  let result;

  if (userRole === "admin" || userRole === "librarian") {
    result = await pool.query(
      `
      UPDATE fines
      SET
        payment_status = 'Paid',
        payment_date = CURRENT_TIMESTAMP
      WHERE id = $1
        AND payment_status = 'Unpaid'
      RETURNING *;
      `,
      [fineId]
    );
  } else if (userRole === "member") {
    result = await pool.query(
      `
      UPDATE fines f
      SET
        payment_status = 'Paid',
        payment_date = CURRENT_TIMESTAMP
      FROM members m
      WHERE f.id = $1
        AND f.member_id = m.id
        AND m.user_id = $2
        AND f.payment_status = 'Unpaid'
      RETURNING f.*;
      `,
      [fineId, userId]
    );
  } else {
    throw new Error("You are not authorized to pay this fine");
  }

  if (result.rows.length === 0) {
    throw new Error("Fine not found, already paid, or not assigned to you");
  }

  return result.rows[0];
};

module.exports = {
  calculateFine,
  createOrUpdateFine,
  getAllFines,
  getMyFines,
  getFineById,
  payFine,
};