// models/Kit.js
const mongoose = require("mongoose");

const kitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    description: { type: String, lowercase: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Kit", kitSchema);
