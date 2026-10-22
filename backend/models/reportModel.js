const pool = require("../config/db");

const getBorrowingReport = async () => {
  const result = await pool.query(`
    SELECT *
    FROM borrow_transactions
    LIMIT 1;
  `);

  console.log("BORROW TRANSACTION COLUMNS:", result.fields.map(field => field.name));
  console.log("BORROW TRANSACTION SAMPLE:", result.rows[0]);

  return result.rows;
};

module.exports = {
  getBorrowingReport,
};