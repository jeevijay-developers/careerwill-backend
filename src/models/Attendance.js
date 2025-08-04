// models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    inTime: {
      type: String, // If storing as string like "09:00 AM"
      default: "N/A",
    },
    outTime: {
      type: String,
      default: "N/A",
    },
    lateArrival: {
      type: String,
      default: "N/A",
    },
    earlyDeparture: {
      type: String,
      default: "N/A",
    },
    workingHours: {
      type: String,
      default: "N/A",
    },
    otDuration: {
      type: String,
      default: "N/A",
    },
    presentStatus: {
      type: String,
      default: "N/A",
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
