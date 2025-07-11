const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();

const generateToken = async (user) => {
  const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Access denied" });

    if (token.startsWith("Bearer ")) {
      const TOKEN = token.slice(7, token.length).trimLeft();
      const decoded = jwt.verify(TOKEN, process.env.JWT_SECRET);
      req.userId = decoded.userId; // matches generateToken payload
      next();
    } else {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    // console.log(error);

    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { generateToken, verifyToken };
