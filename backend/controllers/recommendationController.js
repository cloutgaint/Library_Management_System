const {
  getRecommendations,
} = require("../models/recommendationModel");

// Get recommended books for logged-in user
const getRecommendedBooks = async (req, res) => {
  try {
    const userId = req.user.id;

    const recommendations = await getRecommendations(userId);

    res.status(200).json({
      message: "Recommendations fetched successfully",
      recommendations,
    });
  } catch (error) {
    console.error("Recommendation Error:", error);

    res.status(500).json({
      message: "Failed to get recommendations",
    });
  }
};

module.exports = {
  getRecommendedBooks,
};