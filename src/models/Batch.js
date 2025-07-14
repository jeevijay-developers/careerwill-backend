const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    class: { type: String, required: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);
batchSchema.virtual("duration").get(function () {
  const ms = this.endDate - this.startDate;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
});
batchSchema.set("toJSON", { virtuals: true });

// const batch = await Batch.findById(id).lean({ virtuals: true });
// console.log(batch.duration); // → e.g. 30 (days)

module.exports = mongoose.model("Batch", batchSchema);
