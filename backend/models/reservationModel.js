const pool = require("../config/db");

const getAllReservations = async () => {
  const query = `
    SELECT
      r.id,
      r.member_id,
      m.user_id,
      u.full_name,
      u.email,
      r.book_id,
      b.title,
      b.author,
      r.reservation_date,
      r.queue_position,
      r.status,
      r.created_at
    FROM reservations r
    JOIN members m ON r.member_id = m.id
    JOIN users u ON m.user_id = u.id
    JOIN books b ON r.book_id = b.id
    ORDER BY r.book_id, r.queue_position;
  `;

  const result = await pool.query(query);

  return result.rows;
};

const getReservationById = async (id) => {
  const query = `
    SELECT
      r.id,
      r.member_id,
      m.user_id,
      u.full_name,
      u.email,
      r.book_id,
      b.title,
      b.author,
      r.reservation_date,
      r.queue_position,
      r.status,
      r.created_at
    FROM reservations r
    JOIN members m ON r.member_id = m.id
    JOIN users u ON m.user_id = u.id
    JOIN books b ON r.book_id = b.id
    WHERE r.id = $1;
  `;

  const result = await pool.query(query, [id]);

  return result.rows[0];
};

const getReservationsByMember = async (memberId) => {
  const query = `
    SELECT
      r.id,
      r.member_id,
      r.book_id,
      b.title,
      b.author,
      b.isbn,
      r.reservation_date,
      r.queue_position,
      r.status,
      r.created_at
    FROM reservations r
    JOIN books b ON r.book_id = b.id
    WHERE r.member_id = $1
    ORDER BY r.created_at DESC;
  `;

  const result = await pool.query(query, [memberId]);

  return result.rows;
};

const createReservation = async (memberId, bookId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const memberResult = await client.query(
      `
      SELECT id
      FROM members
      WHERE id = $1;
      `,
      [memberId]
    );

    if (memberResult.rows.length === 0) {
      throw new Error("Member not found");
    }

    const bookResult = await client.query(
      `
      SELECT id, title
      FROM books
      WHERE id = $1;
      `,
      [bookId]
    );

    if (bookResult.rows.length === 0) {
      throw new Error("Book not found");
    }

    const existingReservation = await client.query(
      `
      SELECT id
      FROM reservations
      WHERE member_id = $1
        AND book_id = $2
        AND status IN ('Waiting', 'Ready');
      `,
      [memberId, bookId]
    );

    if (existingReservation.rows.length > 0) {
      throw new Error("Reservation already exists");
    }

    const queueResult = await client.query(
      `
      SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position
      FROM reservations
      WHERE book_id = $1
        AND status = 'Waiting';
      `,
      [bookId]
    );

    const nextPosition = queueResult.rows[0].next_position;

    const reservationResult = await client.query(
      `
      INSERT INTO reservations
      (
        member_id,
        book_id,
        reservation_date,
        queue_position,
        status
      )
      VALUES
      ($1, $2, CURRENT_TIMESTAMP, $3, 'Waiting')
      RETURNING *;
      `,
      [memberId, bookId, nextPosition]
    );

    await client.query("COMMIT");

    return reservationResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const cancelReservation = async (
  reservationId,
  userId,
  userRole
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reservationResult = await client.query(
      `
      SELECT
        r.id,
        r.book_id,
        r.queue_position,
        r.status,
        m.user_id
      FROM reservations r
      JOIN members m ON r.member_id = m.id
      WHERE r.id = $1
      FOR UPDATE;
      `,
      [reservationId]
    );

    if (reservationResult.rows.length === 0) {
      throw new Error("Reservation not found");
    }

    const reservation = reservationResult.rows[0];

    if (
      userRole === "member" &&
      reservation.user_id !== userId
    ) {
      throw new Error("Access denied");
    }

    if (reservation.status === "Cancelled") {
      throw new Error("Reservation already cancelled");
    }

    const cancelledResult = await client.query(
      `
      UPDATE reservations
      SET
        status = 'Cancelled',
        queue_position = NULL
      WHERE id = $1
      RETURNING *;
      `,
      [reservationId]
    );

    if (
      reservation.status === "Waiting" &&
      reservation.queue_position !== null
    ) {
      await client.query(
        `
        UPDATE reservations
        SET queue_position = queue_position - 1
        WHERE book_id = $1
          AND status = 'Waiting'
          AND queue_position > $2;
        `,
        [
          reservation.book_id,
          reservation.queue_position,
        ]
      );
    }

    await client.query("COMMIT");

    return cancelledResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const markReservationReady = async (reservationId) => {
  const query = `
    UPDATE reservations
    SET
      status = 'Ready',
      queue_position = NULL
    WHERE id = $1
      AND status = 'Waiting'
    RETURNING *;
  `;

  const result = await pool.query(query, [reservationId]);

  if (result.rows.length === 0) {
    throw new Error("Reservation not found or not waiting");
  }

  return result.rows[0];
};

const autoCancelExpiredReservations = async () => {
  const query = `
    UPDATE reservations
    SET
      status = 'Cancelled',
      queue_position = NULL
    WHERE status = 'Ready'
      AND reservation_date < CURRENT_TIMESTAMP - INTERVAL '2 days'
    RETURNING *;
  `;

  const result = await pool.query(query);

  return result.rows;
};

module.exports = {
  getAllReservations,
  getReservationById,
  getReservationsByMember,
  createReservation,
  cancelReservation,
  markReservationReady,
  autoCancelExpiredReservations,
};