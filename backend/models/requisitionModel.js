const pool = require("../config/db");

const createRequisition = async (userId, { title, author, isbn, reason }) => {
  const result = await pool.query(`
    INSERT INTO book_requisitions (member_id, title, author, isbn, reason)
    SELECT m.id, $2, $3, $4, $5 FROM members m WHERE m.user_id = $1
    RETURNING *
  `, [userId, title, author, isbn || null, reason || ""]);
  if (!result.rows.length) throw new Error("Member profile not found");
  return result.rows[0];
};

const listMyRequisitions = async (userId) => {
  const result = await pool.query(`
    SELECT r.* FROM book_requisitions r
    JOIN members m ON m.id = r.member_id
    WHERE m.user_id = $1 ORDER BY r.created_at DESC
  `, [userId]);
  return result.rows;
};

const listRequisitions = async () => {
  const result = await pool.query(`
    SELECT r.*, u.full_name AS member_name
    FROM book_requisitions r
    JOIN members m ON m.id = r.member_id
    JOIN users u ON u.id = m.user_id
    ORDER BY r.created_at DESC
  `);
  return result.rows;
};

const updateRequisitionStatus = async (id, userId, status, note) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT * FROM book_requisitions WHERE id = $1 FOR UPDATE", [id]
    );
    if (!existing.rows.length) throw new Error("Requisition not found");
    const before = existing.rows[0];
    const transitions = {
      Pending: ["Approved", "Rejected"],
      Approved: ["Ordered", "Rejected"],
      Ordered: ["Acquired"],
      Rejected: [],
      Acquired: []
    };
    if (!transitions[before.status]?.includes(status)) {
      throw new Error("Invalid requisition status transition");
    }
    const updated = await client.query(`
      UPDATE book_requisitions
      SET status = $2, reviewed_by = $3, decision_note = $4,
          reviewed_at = NOW(), updated_at = NOW()
      WHERE id = $1 RETURNING *
    `, [id, status, userId, note || null]);
    await client.query(`
      INSERT INTO book_requisition_history
        (requisition_id, previous_status, new_status, changed_by, note)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, before.status, status, userId, note || null]);
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createRequisition, listMyRequisitions, listRequisitions, updateRequisitionStatus
};
