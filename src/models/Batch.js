const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    class: { type: String, required: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Batch", batchSchema);
