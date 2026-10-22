const express = require("express");

const router = express.Router();

const {
  calculateFineController,
  createFineController,
  getFines,
  getMyFinesController,
  getFine,
  payFineController,
} = require("../controllers/fineController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getFines
);

router.get(
  "/my-fines",
  authMiddleware,
  getMyFinesController
);

router.get(
  "/calculate/:transactionId",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  calculateFineController
);

router.post(
  "/:transactionId",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  createFineController
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getFine
);

router.put(
  "/:id/pay",
  authMiddleware,
  payFineController
);

module.exports = router;