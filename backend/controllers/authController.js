const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
  createUser,
  createUserWithMember,
  findUserByEmail,
  updatePassword,
} = require("../models/userModel");

const register = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    const selectedRole = role || "member";

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    if (selectedRole === "member") {
      user = await createUserWithMember(
        full_name,
        email,
        hashedPassword,
        selectedRole
      );
    } else {
      user = await createUser(
        full_name,
        email,
        hashedPassword,
        selectedRole
      );
    }

    res.status(201).json({
      message: "User Registered Successfully",
      user,
    });
  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      message: "Registration Failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      message: "Login Failed",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await updatePassword(email, hashedPassword);

    res.status(200).json({
      message: "Password Updated Successfully",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    res.status(500).json({
      message: "Failed to Update Password",
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
};