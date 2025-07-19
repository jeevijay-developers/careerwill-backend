const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const { uploadToCloudinary } = require("../middleware/cloudinary");
const TestScore = require("../models/TestScore");
const Kit = require("../models/Kit");


exports.createStudent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, batch, phone, image, parent, kit, address } = req.body;

    // Validate required fields
    if (!name || !batch || !phone || !parent) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (kit && !Array.isArray(kit)) {
      return res.status(400).json({ message: "Kit must be an array" });
    }
    // Validate kit ObjectIds
    if (kit && Array.isArray(kit)) {
      for (const kitId of kit) {
        if (!mongoose.Types.ObjectId.isValid(kitId)) {
          return res.status(400).json({ message: `Invalid kit id: ${kitId}` });
        }
      }
    }

    if (!image.url || !image.url === "") {
      return res.status(400).json({ message: "Image URL is required" });
    }
    let parentId;
    let parentDoc = await User.findOne({
      email: parent.email,
      role: "PARENT",
    }).session(session);

    // If parent does not exist, create one
    if (!parentDoc) {
      const newParent = new User({
        username: parent.username,
        password: parent.password,
        email: parent.email,
        phone: parent.phone,
        role: "PARENT",
        students: [],
      });
      parentDoc = await newParent.save({ session });
    }

    parentId = parentDoc._id;

    // Upload image if exists
    let imageObject = image;
    // Create new student
    const newStudent = new Student({
      name,
      batch,
      phone,
      kit: kit || [],
      parent: parentId,
      address,
      image: imageObject,
    });

    await newStudent.save({ session });

    // Push student to parent's student list
    parentDoc.students = parentDoc.students || [];
    parentDoc.students.push(newStudent._id);
    await parentDoc.save({ session });

    await session.commitTransaction();
    // Populate kit for response
    await newStudent.populate('kit');
    res
      .status(201)
      .json({ message: "Student created successfully", student: newStudent });
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
    const student = await Student.findById(req.params.id).populate("parent").populate("kit");
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
    const allKitIds = allKits.map(kit => kit._id.toString());

    // Fetch all students in the batch
    const students = await Student.find({
      batch: batchId
    }).populate("parent").populate("kit");

    // Filter students who do not have all kits
    const incompleteStudents = students.filter(student => {
      const studentKitIds = (student.kit || []).map(k => (k._id ? k._id.toString() : k.toString()));
      // If student is missing at least one kit
      return allKitIds.some(kitId => !studentKitIds.includes(kitId));
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
    student.kit = [...(student.kit || []), ...kit.map(id => id.toString())];

    // Remove duplicates
    student.kit = [...new Set(student.kit.map(id => id.toString()))];

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
