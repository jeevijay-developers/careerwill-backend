const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, lowercase: true, trim: true },
    rollNo: { type: Number, required: true },
    class: {
      type: String,
      required: true,
      default: "N/A",
      lowercase: true,
      trim: true,
    },
    previousSchoolName: { type: String, default: "" },
    medium: { type: String, default: "", lowercase: true, trim: true },
    DOB: { type: String, default: "" },
    gender: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      enum: ["MALE", "FEMALE"],
      default: "MALE",
    },
    category: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    pinCode: { type: String, default: "" },
    permanentAddress: { type: String, default: "" },
    mobileNumber: { type: String, required: true }, // mohbile number is required
    tShirtSize: { type: String, default: "" },
    howDidYouHearAboutUs: { type: String, default: "" },
    programmeName: { type: String, default: "" },
    emergencyContact: { type: String }, // emergency contact is required
    email: { type: String },

    parent: {
      occupation: { type: String, default: "" },
      fatherName: { type: String, default: "" },
      motherName: { type: String, default: "" },
      parentContact: { type: String, required: true }, // parent contact is required
      email: { type: String, default: "" },
    },

    image: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    batch: {
      type: String,
    },
    fee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      default: null,
    },
    phone: { type: String },
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
// studentSchema.plugin(AutoIncrement, {
//   inc_field: "rollNo",
//   start_seq: 1,
// });

module.exports = mongoose.model("Student", studentSchema);
