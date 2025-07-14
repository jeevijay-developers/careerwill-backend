// models/TestScore.js
const mongoose = require("mongoose");

const testScoreSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
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
    date: { type: Date, required: true },
  },
  { timestamps: true }
);
testScoreSchema.index({ student: 1, batch: 1, date: -1 });

module.exports = mongoose.model("TestScore", testScoreSchema);
