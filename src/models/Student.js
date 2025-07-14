const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const studentSchema = new mongoose.Schema(
  {
    studentId: Number, // This will be auto-incremented
    name: { type: String, required: true },
    rollNo: { type: String, required: true, unique: true },
    class: { type: String, required: true },
    kit: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit",
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
  inc_field: "studentId",
  start_seq: 1,
});

module.exports = mongoose.model("Student", studentSchema);
