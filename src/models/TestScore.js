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
      required: true,
      lowercase: true,
      trim: true,
    },
    father: {
      type: String,
      required: true,
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
        name: { type: String, required: true, lowercase: true, trim: true },
        marks: { type: Number, required: true, min: 0 },
      },
    ],
    percentile: { type: Number, required: true },
    total: { type: Number, required: true },
    rank: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now() },
  },
  { timestamps: true }
);
testScoreSchema.index({ student: 1, batch: 1, date: -1 });

module.exports = mongoose.model("TestScore", testScoreSchema);
