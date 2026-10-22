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

    if (role && role !== "member") return res.status(403).json({message:"Only member self-registration is allowed"});
    const selectedRole = "member";

    if (typeof full_name !== "string" || !full_name.trim() || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== "string" || password.length < 10 || password.length > 128) return res.status(400).json({message:"Invalid registration details"});
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
      user: {id:user.id,full_name:user.full_name,email:user.email,role:user.role},
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

const forgotPassword = async (_req,res) => res.status(503).json({message:"Password recovery is temporarily unavailable. Contact a library administrator."});

module.exports = {
  register,
  login,
  forgotPassword,
};