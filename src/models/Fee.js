// models/Fee.js
const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    studentRollNo: {
      type: Number,
      required: true,
    },
    totalFees: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    finalFees: { type: Number, required: true },
    approvedBy: { type: String, default: "" },

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
        mode: { type: String, required: true },
        dateOfReceipt: { type: Date, required: true },
        receiptNumber: { type: String, required: true },
        UTR: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);
