const {
  getDashboardStatistics,
} = require("../models/dashboardModel");

const getDashboardStatisticsController = async (req, res) => {
  try {
    const statistics = await getDashboardStatistics();

    res.status(200).json({
      message: "Dashboard statistics fetched successfully",
      statistics,
    });
  } catch (error) {
    console.error("Dashboard Statistics Error:", error);

    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
    });
  }
};

module.exports = {
  getDashboardStatisticsController,
};