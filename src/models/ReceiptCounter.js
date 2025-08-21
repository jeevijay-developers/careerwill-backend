const mongoose = require("mongoose");

const receiptCounterSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    counter: { type: Number, required: true, default: 100000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReceiptCounter", receiptCounterSchema);
