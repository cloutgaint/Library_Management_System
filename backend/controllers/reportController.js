const {
  getBorrowingReport,
} = require("../models/reportModel");

const getBorrowingReportController = async (req, res) => {
  try {
    const report = await getBorrowingReport();

    res.status(200).json({
      message: "Borrowing report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Report Generation Error:", error);

    res.status(500).json({
      message: "Failed to generate borrowing report",
    });
  }
};

module.exports = {
  getBorrowingReportController,
};
