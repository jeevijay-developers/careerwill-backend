const mongoose = require("mongoose");

const LoginOPTSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  code: {
    type: Number,
    required: true,
    lowercase: true,
    trim: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "15m", // Document will be removed after 1 hour
  },
});

module.exports = mongoose.model("LoginOPT", LoginOPTSchema);
