const pool = require("../config/db");

const {
  getAllReservations,
  getReservationById,
  getReservationsByMember,
  createReservation,
  cancelReservation,
  markReservationReady,
  autoCancelExpiredReservations,
} = require("../models/reservationModel");

const getReservations = async (req, res) => {
  try {
    const reservations = await getAllReservations();

    res.status(200).json({
      message: "Reservations fetched successfully",
      reservations,
    });
  } catch (error) {
    console.error("Get Reservations Error:", error);

    res.status(500).json({
      message: "Failed to fetch reservations",
    });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;

    const memberResult = await pool.query(
      `
      SELECT id
      FROM members
      WHERE user_id = $1;
      `,
      [userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        message: "Member profile not found",
      });
    }

    const memberId = memberResult.rows[0].id;

    const reservations = await getReservationsByMember(memberId);

    res.status(200).json({
      message: "Member reservations fetched successfully",
      reservations,
    });
  } catch (error) {
    console.error("Get My Reservations Error:", error);

    res.status(500).json({
      message: "Failed to fetch member reservations",
    });
  }
};

const getReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await getReservationById(id);

    if (!reservation) {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    res.status(200).json({
      message: "Reservation fetched successfully",
      reservation,
    });
  } catch (error) {
    console.error("Get Reservation Error:", error);

    res.status(500).json({
      message: "Failed to fetch reservation",
    });
  }
};

const addReservation = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookId = req.body.bookId || req.body.book_id;

    if (!bookId) {
      return res.status(400).json({
        message: "Book ID is required",
      });
    }

    const memberResult = await pool.query(
      `
      SELECT id
      FROM members
      WHERE user_id = $1;
      `,
      [userId]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        message: "Member profile not found",
      });
    }

    const memberId = memberResult.rows[0].id;

    const reservation = await createReservation(memberId, bookId);

    res.status(201).json({
      message: "Reservation created successfully",
      reservation,
    });
  } catch (error) {
    console.error("Create Reservation Error:", error);

    if (error.message === "Member not found") {
      return res.status(404).json({
        message: "Member not found",
      });
    }

    if (error.message === "Book not found") {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    if (error.message === "Reservation already exists") {
      return res.status(400).json({
        message: "Reservation already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create reservation",
    });
  }
};

const cancelReservationController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const reservation = await cancelReservation(id, userId, userRole);

    res.status(200).json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    console.error("Cancel Reservation Error:", error);

    if (error.message === "Reservation not found") {
      return res.status(404).json({
        message: "Reservation not found",
      });
    }

    if (error.message === "Access denied") {
      return res.status(403).json({
        message: "You can only cancel your own reservation",
      });
    }

    if (error.message === "Reservation already cancelled") {
      return res.status(400).json({
        message: "Reservation already cancelled",
      });
    }

    res.status(500).json({
      message: "Failed to cancel reservation",
    });
  }
};

const markReservationReadyController = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await markReservationReady(id);

    res.status(200).json({
      message: "Reservation marked as ready",
      reservation,
    });
  } catch (error) {
    console.error("Mark Reservation Ready Error:", error);

    res.status(404).json({
      message: "Reservation not found or not waiting",
    });
  }
};

const autoCancelExpiredReservationsController = async (req, res) => {
  try {
    const reservations = await autoCancelExpiredReservations();

    res.status(200).json({
      message: "Expired reservations auto-cancelled successfully",
      cancelledCount: reservations.length,
      reservations,
    });
  } catch (error) {
    console.error("Auto Cancel Reservations Error:", error);

    res.status(500).json({
      message: "Failed to auto-cancel reservations",
    });
  }
};

module.exports = {
  getReservations,
  getMyReservations,
  getReservation,
  addReservation,
  cancelReservationController,
  markReservationReadyController,
  autoCancelExpiredReservationsController,
};