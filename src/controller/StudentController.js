const mongoose = require("mongoose");
const User = require("../models/User");
const Student = require("../models/Student");
const { uploadToCloudinary } = require("../middleware/cloudinary");

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
      kit,
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
    const students = await Student.find().populate("parent");
    res.status(200).json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("parent");
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
