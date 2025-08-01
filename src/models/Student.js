const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rollNo: Number,
    class: { type: String, required: true },
    previousSchoolName: { type: String, default: "" },
    medium: { type: String, default: "" },
    DOB: { type: Date, required: true },
    gender: { type: String, required: true },
    category: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    pinCode: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    mobileNumber: { type: String, required: true },
    tShirtSize: { type: String, default: "" },
    howDidYouHearAboutUs: { type: String, default: "" },
    programmeName: { type: String, default: "" },
    parentContact: { type: String, required: true },
    emergencyContact: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    parent: {
      occupation: { type: String, default: "" },
      fatherName: { type: String, default: "" },
      motherName: { type: String, default: "" },
      parentContact: { type: String, required: true },
      email: { type: String, required: true, unique: true },
    },

    image: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kit",
      },
    ],
  },
  { timestamps: true }
);

// Apply auto-increment plugin
studentSchema.plugin(AutoIncrement, {
  inc_field: "rollNo",
  start_seq: 1,
});

module.exports = mongoose.model("Student", studentSchema);
