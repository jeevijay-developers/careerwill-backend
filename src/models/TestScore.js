// models/TestScore.js
const mongoose = require("mongoose");

const testScoreSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: Number,
      required: true,
    },
    student: {
      type: String,
      lowercase: true,
      trim: true,
    },
    father: {
      type: String,
      lowercase: true,
      trim: true,
    },
    batch: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    subjects: [
      {
        name: { type: String, lowercase: true, trim: true },
        marks: { type: Number, required: true },
      },
    ],
    percentile: { type: Number },
    total: { type: Number },
    rank: { type: Number },
    date: { type: Date, default: Date.now() },
    name: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);
testScoreSchema.index({ student: 1, batch: 1, date: -1 });

module.exports = mongoose.model("TestScore", testScoreSchema);
