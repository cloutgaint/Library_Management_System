const express = require("express");

const router = express.Router();

const {
  getDashboardStatisticsController,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/statistics",
  authMiddleware,
  roleMiddleware("admin", "librarian"),
  getDashboardStatisticsController
);

module.exports = router;
