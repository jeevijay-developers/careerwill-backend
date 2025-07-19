// models/Fee.js
const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    studentRollNo: {
      type: Number,
      required: true,
    },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["PAID", "UNPAID", "PARTIAL"],
      default: "UNPAID",
    },
    submissions: [
      {
        date: { type: Date, required: true },
        amount: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);
