const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rollNo: Number,
    image: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    address: { type: String, default: "" },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      default: null,
    },
    phone: { type: String, required: true },
    kit: [
      {
        type: String,
      },
    ],
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // role: PARENT
  },
  { timestamps: true }
);

// Apply auto-increment plugin
studentSchema.plugin(AutoIncrement, {
  inc_field: "rollNo",
  start_seq: 1,
});

module.exports = mongoose.model("Student", studentSchema);
