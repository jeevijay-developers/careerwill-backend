// models/Fee.js
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const feeSchema = new mongoose.Schema(
  {
    studentRollNo: {
      type: Number,
      required: true,
      unique: true,
    },
    totalFees: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    finalFees: { type: Number, required: true, default: 0 },
    approvedBy: { type: String, default: "" },

    paidAmount: { type: Number, default: 0 },
    dueDate: { type: Date },
    pendingAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PAID", "UNPAID", "PARTIAL"],
      default: "UNPAID",
    },
    submissions: [
      {
        // date: { type: Date, required: true },
        amount: { type: Number },
        mode: { type: String },
        dateOfReceipt: { type: Date },
        receiptNumber: { type: String },
        UTR: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fee", feeSchema);
