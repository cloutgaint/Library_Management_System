
const roleMiddleware = require("../middleware/roleMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
} = require("../controllers/authController");router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/test", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Authentication successful",
    user: req.user,
  });
});
router.get(
  "/admin-test",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.status(200).json({
      message: "Admin access granted",
      user: req.user,
    });
  }
);
module.exports = router;