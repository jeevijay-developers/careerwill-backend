const User = require("../models/User");
const { comparePassword } = require("../middleware/bcrypt");
const { generateToken } = require("../middleware/jwt");
const PasswordReset = require("../models/PasswordReset");
const mongoose = require("mongoose");
const { sendMail } = require("../middleware/mailer");
const bcrypt = require("bcrypt");
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // console.log(user);

    const comparedPassword = await comparePassword(password, user.password);
    if (!comparedPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = await generateToken(user);
    return res
      .status(200)
      .json({ message: "Login successful", token: token, user });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.signUp = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const user = await User.findOne({ email });

    if (user) return res.status(409).json({ message: "User already exists" });

    const USER = await User.create({
      username: name,
      email,
      password,
      role,
      phone,
    });
    res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.log("Cannot create account", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.log("Cannot fetch users", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.generateCode = async (req, res) => {
  const { email } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // (await session).startTransaction();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    const passwordReset = new PasswordReset({
      email: user.email,
      code: code,
    });
    // Save the code to the user document
    await passwordReset.save();
    //
    const mailMessage = `Your password reset code is: ${code}`;
    await sendMail(user.email, "Password Reset Code", mailMessage);
    await session.commitTransaction();
    return res.status(200).json({
      message: "Code sent successfully",
      status: true,
    });
  } catch (error) {
    session.abortTransaction();
    await session.endSession();
    console.error("Error generating code:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

exports.confirmCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const passwordReset = await PasswordReset.findOne({ email, code });
    if (!passwordReset) {
      return res.status(404).json({ message: "Invalid code or email" });
    }

    const encoded = Buffer.from(`EMAIL:${email},STATUS:${true}`).toString(
      "base64"
    );
    passwordReset.token = encoded;
    await passwordReset.save();
    // Code is valid, proceed with password reset
    return res.status(200).json({
      message: "Code confirmed successfully",
      status: true,
      token: encoded,
    });
  } catch (error) {
    console.error("Error confirming code:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { newPassword, token } = req.body;
  // console.log(typeof newPassword, token);

  try {
    // Decode the base64 token
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [emailPart, statusPart] = decoded.split(",");

    // Extract email and status
    const email = emailPart?.split(":")[1];
    const status = statusPart?.split(":")[1];

    if (!email || status !== "true") {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    // check email is exists
    const isValid = await PasswordReset.findOne({ email });
    if (!isValid) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    // const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = newPassword;
    await user.save();

    // console.log(hashedPassword, user.password);

    // Remove reset records
    await PasswordReset.deleteMany({ email });

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
