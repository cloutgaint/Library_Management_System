const pool = require("../config/db");

const createRequisition = async (userId, { title, author, isbn, reason }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const member = await client.query(
      "SELECT id FROM members WHERE user_id = $1 FOR UPDATE", [userId]
    );
    if (!member.rows.length) throw new Error("Member profile not found");
    const duplicate = await client.query(`
      SELECT id FROM book_requisitions
      WHERE member_id = $1 AND status IN ('Pending', 'Approved', 'Ordered')
        AND (LOWER(title) = LOWER($2) OR ($3::text IS NOT NULL AND isbn = $3))
      LIMIT 1
    `, [member.rows[0].id, title, isbn || null]);
    if (duplicate.rows.length) throw new Error("Active requisition already exists");
    const result = await client.query(`
      INSERT INTO book_requisitions (member_id, title, author, isbn, reason)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [member.rows[0].id, title, author, isbn || null, reason || ""]);
    await client.query(`
      INSERT INTO book_requisition_history
        (requisition_id, previous_status, new_status, changed_by, note)
      VALUES ($1, NULL, 'Pending', $2, 'Submitted')
    `, [result.rows[0].id, userId]);
    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
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
