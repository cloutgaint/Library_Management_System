const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const pool = require("../config/db");
const {sendEmail} = require("../services/emailService");
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

const forgotPassword = async (req,res) => {
 const email=typeof req.body?.email==="string"?req.body.email.trim().toLowerCase():"";
 if(!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({message:"Valid email required"});
 if(!process.env.RESET_URL_BASE || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD)
   return res.status(503).json({message:"Password recovery service is not configured"});
 try{
  const user=await findUserByEmail(email);
  if(user){
   const token=crypto.randomBytes(32).toString("hex");
   const hash=crypto.createHash("sha256").update(token).digest("hex");
   await pool.query("INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,NOW()+INTERVAL '15 minutes')",[user.id,hash]);
   const url=new URL(process.env.RESET_URL_BASE);
   url.hash="token="+encodeURIComponent(token);
   await sendEmail(email,"Library password reset","Open this link within 15 minutes to reset your password: "+url.toString());
  }
  return res.json({message:"If this email is registered, password reset instructions will be sent."});
 }catch(err){
  console.error("Password reset request failed",err);
  return res.status(503).json({message:"Password recovery is temporarily unavailable"});
 }
};
const confirmPasswordReset=async(req,res)=>{
 const token=req.body?.token,password=req.body?.newPassword;
 if(typeof token!=="string"||!/^[0-9a-f]{64}$/.test(token)||typeof password!=="string"||password.length<10||password.length>128)
 return res.status(400).json({message:"Invalid reset request"});
 const hash=crypto.createHash("sha256").update(token).digest("hex");
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  const result=await client.query("SELECT id,user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",[hash]);
  if(!result.rowCount){await client.query("ROLLBACK");return res.status(400).json({message:"Invalid or expired reset link"});}
  const passwordHash=await bcrypt.hash(password,12);
  await client.query("UPDATE users SET password=$1 WHERE id=$2",[passwordHash,result.rows[0].user_id]);
  await client.query("UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=$1 AND used_at IS NULL",[result.rows[0].user_id]);
  await client.query("COMMIT");
  return res.json({message:"Password updated. Please sign in."});
 }catch(err){await client.query("ROLLBACK");console.error("Password reset confirmation failed",err);return res.status(503).json({message:"Unable to reset password"});}
 finally{client.release();}
};

module.exports = {
  register,
  login,
  forgotPassword,
  confirmPasswordReset,
};