const {
  calculateFine,
  createOrUpdateFine,
  getAllFines,
  getMyFines,
  getFineById,
  payFine,
} = require("../models/fineModel");

const calculateFineController = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const fine = await calculateFine(transactionId);

    res.status(200).json({
      message: "Fine calculated successfully",
      fine,
    });
  } catch (error) {
    console.error("Calculate Fine Error:", error);

    if (error.message === "Transaction not found") {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.status(500).json({
      message: "Failed to calculate fine",
    });
  }
};

const createFineController = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const fine = await createOrUpdateFine(transactionId);

    res.status(201).json({
      message: "Fine created/updated successfully",
      fine,
    });
  } catch (error) {
    console.error("Create Fine Error:", error);

    if (error.message === "Transaction not found") {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    res.status(500).json({
      message: "Failed to create/update fine",
    });
  }
};

const getFines = async (req, res) => {
  try {
    const fines = await getAllFines();

    res.status(200).json({
      message: "Fines fetched successfully",
      fines,
    });
  } catch (error) {
    console.error("Get Fines Error:", error);

    res.status(500).json({
      message: "Failed to fetch fines",
    });
  }
};

const getMyFinesController = async (req, res) => {
  try {
    const userId = req.user.id;

    const fines = await getMyFines(userId);

    res.status(200).json({
      message: "Member fines fetched successfully",
      fines,
    });
  } catch (error) {
    console.error("Get My Fines Error:", error);

    res.status(500).json({
      message: "Failed to fetch member fines",
    });
  }
};

const getFine = async (req, res) => {
  try {
    const { id } = req.params;

    const fine = await getFineById(id);

    if (!fine) {
      return res.status(404).json({
        message: "Fine not found",
      });
    }

    res.status(200).json({
      message: "Fine fetched successfully",
      fine,
    });
  } catch (error) {
    console.error("Get Fine Error:", error);

    res.status(500).json({
      message: "Failed to fetch fine",
    });
  }
};

const payFineController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const fine = await payFine(id, userId, userRole);

    res.status(200).json({
      message: "Fine paid successfully",
      fine,
    });
  } catch (error) {
    console.error("Pay Fine Error:", error);

    res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  calculateFineController,
  createFineController,
  getFines,
  getMyFinesController,
  getFine,
  payFineController,
};