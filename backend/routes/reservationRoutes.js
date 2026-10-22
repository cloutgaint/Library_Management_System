const express = require("express");

const router = express.Router();

const {
  getReservations,
  getMyReservations,
  getReservation,
  addReservation,
  cancelReservationController,
  markReservationReadyController,
  autoCancelExpiredReservationsController,
} = require("../controllers/reservationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getReservations
);

router.get(
  "/my-reservations",
  authMiddleware,
  roleMiddleware("member"),
  getMyReservations
);

router.put(
  "/auto-cancel",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  autoCancelExpiredReservationsController
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getReservation
);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("member"),
  addReservation
);

router.delete(
  "/:id",
  authMiddleware,
  cancelReservationController
);

router.put(
  "/:id/ready",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  markReservationReadyController
);

module.exports = router;