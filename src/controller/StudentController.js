const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const { uploadToCloudinary } = require("../middleware/cloudinary");
const TestScore = require("../models/TestScore");
const Kit = require("../models/Kit");
const Fee = require("../models/Fee");
const Batch = require("../models/Batch");
const { getNumericRollNumbers, parseDate } = require("../helper/RollNumber");
const Attendance = require("../models/Attendance");

exports.createStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      rollNo,
      name,
      className,
      previousSchoolName,
      medium,
      DOB,
      gender,
      category,
      state,
      city,
      pinCode,
      permanentAddress,
      tShirtSize,
      mobileNumber,
      howDidYouHearAboutUs,
      programmeName,
      emergencyContact,
      email,
      batch,
      phone,
      image,
      parent,
      kit,
    } = req.body;

    const rollNoUsed = await Student.findOne({ rollNo });
    if (rollNoUsed) {
      await session.abortTransaction();
      return res.status(400).json({ error: "Roll number already exists." });
    }

    // Validate required fields
    if (!name || !batch || !mobileNumber) {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Name/Batch/Mobile number required" });
    }

    if (parent) {
      if (!parent.parentContact || !emergencyContact) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "Parent Contact/Emergency Contact required" });
      }
    }

    if (kit && !Array.isArray(kit)) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Kit must be an array" });
    }

    if (kit && Array.isArray(kit)) {
      for (const kitId of kit) {
        if (!mongoose.Types.ObjectId.isValid(kitId)) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Invalid kit id: ${kitId}` });
        }
      }
    }

    if (!image || !image.url || image.url.trim() === "") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Image URL is required" });
    }

    const newStudent = new Student({
      rollNo,
      name: name || "N/A",
      class: className || "N/A",
      previousSchoolName: previousSchoolName || "",
      medium: medium || "",
      DOB: DOB || "",
      gender,
      category: category || "",
      state: state || "",
      city: city || "",
      pinCode: pinCode || "",
      permanentAddress: permanentAddress || "",
      mobileNumber,
      tShirtSize: tShirtSize || "",
      howDidYouHearAboutUs: howDidYouHearAboutUs || "",
      programmeName: programmeName || "",
      emergencyContact: emergencyContact || "",
      email: email || "",
      phone: mobileNumber,
      kit: kit || [],
      image,
      parent: {
        occupation: parent?.occupation || "",
        fatherName: parent?.fatherName || "",
        motherName: parent?.motherName || "",
        parentContact: parent?.parentContact || "",
        email: parent?.email || "",
      },
    });

    await newStudent.save({ session });

    await session.commitTransaction();

    await newStudent.populate("kit");

    res.status(201).json({
      message: "Student created successfully",
      student: newStudent,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error creating student:", err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    session.endSession();
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    res.status(200).json({
      message: "Image uploaded successfully",
      image: result,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 10; // Number of items per page
    const skip = (page - 1) * limit;

    const totalStudents = await Student.countDocuments();
    const students = await Student.find()
      .populate("parent")
      .populate("kit")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional: sort by latest created

    res.status(200).json({
      total: totalStudents,
      page,
      limit,
      totalPages: Math.ceil(totalStudents / limit),
      students,
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("kit");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (err) {
    console.error("Error fetching student:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.findParentByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const parent = await User.findOne({ email, role: "PARENT" });
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    res.status(200).json(parent);
  } catch (err) {
    console.error("Error finding parent:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentTestScores = async (req, res) => {
  try {
    const rollNumber = req.params.rollNumber;
    if (!rollNumber) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findOne({ rollNo: rollNumber });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const results = await TestScore.find({ rollNumber });
    if (!results) {
      return res.status(404).json({ message: "Results not found" });
    }

    res.status(200).json(results);
  } catch (err) {
    console.error("Error fetching student test scores:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentWithIncompleteKit = async (req, res) => {
  try {
    const batchId = req.params.batchId;
    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    // Fetch all kits
    const allKits = await Kit.find({}, "_id");
    const allKitIds = allKits.map((kit) => kit._id.toString());

    // Fetch all students in the batch
    const students = await Student.find({
      batch: batchId,
    })
      .populate("parent")
      .populate("kit");

    // Filter students who do not have all kits
    const incompleteStudents = students.filter((student) => {
      const studentKitIds = (student.kit || []).map((k) =>
        k._id ? k._id.toString() : k.toString()
      );
      // If student is missing at least one kit
      return allKitIds.some((kitId) => !studentKitIds.includes(kitId));
    });

    res.status(200).json(incompleteStudents);
  } catch (err) {
    console.error("Error fetching students with incomplete kit:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateStudentKit = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { kit } = req.body;

    if (!kit || !Array.isArray(kit)) {
      return res.status(400).json({ message: "Kit must be an array" });
    }
    // Validate kit ObjectIds
    for (const kitId of kit) {
      if (!mongoose.Types.ObjectId.isValid(kitId)) {
        return res.status(400).json({ message: `Invalid kit id: ${kitId}` });
      }
    }

    const student = await Student.findById(studentId).populate("parent");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Merge kits (avoid duplicates if needed)
    student.kit = [...(student.kit || []), ...kit.map((id) => id.toString())];

    // Remove duplicates
    student.kit = [...new Set(student.kit.map((id) => id.toString()))];

    await student.save();
    await student.populate("kit");

    res.status(200).json({
      message: "Student kit updated successfully",
      student,
    });
  } catch (err) {
    console.error("Error updating student kit:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllStudentFees = async (req, res) => {
  try {
    const fees = await Fee.find();
    res.status(200).json(fees);
  } catch (err) {
    console.error("Error fetching all student fees:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.searchStudents = async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ message: "Query parameter is required" });
  }

  try {
    const regex = new RegExp(query, "i");
    let batchIds = [];
    if (Batch) {
      const batches = await Batch.find({ name: regex }, "_id");
      batchIds = batches.map((b) => b._id);
    }
    const orConditions = [{ name: regex }];
    // Only add rollNo if query is a valid number
    if (!isNaN(query)) {
      orConditions.push({ rollNo: Number(query) });
    }
    if (batchIds.length > 0) {
      orConditions.push({ batch: { $in: batchIds } });
    }
    const students = await Student.find({ $or: orConditions })
      .populate("parent")
      .populate("kit");
    res.status(200).json(students);
  } catch (err) {
    console.error("Error searching students:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

exports.checkRollNumberExists = async (req, res) => {
  try {
    const { rollNumber } = req.params;
    if (!rollNumber) {
      return res.status(400).json({ message: "Roll number is required" });
    }
    const student = await Student.findOne({ rollNo: rollNumber });
    if (student) {
      const rollNumbers = await getNumericRollNumbers();
      return res
        .status(200)
        .json({ exists: true, rollNumbers: Array.from(rollNumbers) });
    } else {
      return res.status(200).json({ exists: false });
    }
  } catch (err) {
    console.error("Error checking roll number:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentsByParentMobileNumber = async (req, res) => {
  try {
    const { mobileNumber } = req.params;
    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required" });
    }
    const students = await Student.find({
      "parent.parentContact": mobileNumber,
    });
    if (!students) {
      return res
        .status(404)
        .json({ message: "No student found", status: false });
    }
    res.status(200).json({ data: students, status: true });
  } catch (err) {
    console.error("Error fetching students by parent mobile number:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAttendenceByRollNumber = async (req, res) => {
  try {
    const { rollNumber } = req.params;
    if (!rollNumber) {
      return res.status(400).json({ message: "Roll number is required" });
    }
    // const student = await Student.findOne({ rollNo: rollNumber });
    // if (!student) {
    //   return res
    //     .status(404)
    //     .json({ message: "No student found", status: false });
    // }
    const data = await Attendance.find({ rollNo: rollNumber });
    res.status(200).json({ data: data, status: true });
  } catch (err) {
    console.error("Error fetching attendence by roll number:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// controllers/attendanceController.js
// const Attendance = require("../models/Attendance");

exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Date query parameter is required in YYYY-MM-DD format",
      });
    }

    const start = parseDate(date);
    if (!start) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD.",
      });
    }

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1); // safe UTC increment

    console.log(
      "Querying date between:",
      start.toISOString(),
      "and",
      end.toISOString()
    );

    const records = await Attendance.find({
      date: { $gte: start, $lt: end },
    }).sort({ rollNo: 1 });

    res.status(200).json(records);
  } catch (err) {
    console.error("Error fetching attendance by date:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

exports.updateStudentBatch = async (req, res) => {
  try {
    const { studentId, newBatchId } = req.body;

    if (!studentId || !newBatchId) {
      return res
        .status(400)
        .json({ message: "Student ID and Batch ID are required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Update the student's batch
    student.batch = newBatchId;
    await student.save();

    res.status(200).json({
      message: "Student batch updated successfully",
      student,
    });
  } catch (err) {
    console.error("Error updating student batch:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
