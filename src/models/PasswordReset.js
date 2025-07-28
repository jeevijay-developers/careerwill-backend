const mongoose = require("mongoose");

const PasswordResetSchema = new mongoose.Schema({
  email: {
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
  token: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "15m", // Document will be removed after 1 hour
  },
});

module.exports = mongoose.model("PasswordReset", PasswordResetSchema);
