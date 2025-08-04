const { comparePassword } = require("../middleware/bcrypt");
const { generateToken, verifyToken } = require("../middleware/jwt");
const User = require("../models/User");
const express = require("express");
const router = express.Router();
const {
  login,
  signUp,
  getUsers,
  generateCode,
  confirmCode,
  resetPassword,
  numberLoginForParent,
} = require("../controller/AuthController");

router.post("/login", login);
router.post("/signup", signUp);
router.get("/getUsers", getUsers);

router.get("/verify-token", verifyToken, async (req, res) => {
  try {
    return res.status(200).json({ message: "Token varified" });
  } catch (error) {
    console.error("Error varifying token:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/parent-login", numberLoginForParent);
router.post("/generate-reset-code", generateCode);
router.post("/confirm-reset-code", confirmCode);
router.post("/reset-password", resetPassword);

module.exports = router;
