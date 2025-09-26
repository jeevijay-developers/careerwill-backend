const { parseDate, parseDateRange } = require("../helper/RollNumber");
const TestScore = require("../models/TestScore");

exports.createTestScore = async (req, res) => {
  try {
    const {
      rollNumber,
      student,
      father,
      batch,
      subjects,
      percentile,
      total,
      rank,
      date,
      name,
    } = req.body;

    // Basic validation
    if (!rollNumber || typeof rollNumber !== "number") {
      return res
        .status(400)
        .json({ message: "rollNumber is required and must be a number" });
    }

    if (!batch || typeof batch !== "string") {
      return res
        .status(400)
        .json({ message: "batch is required and must be a string" });
    }

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one subject is required" });
    }

    // Validate subjects array
    for (let sub of subjects) {
      if (!sub.name || typeof sub.name !== "string") {
        return res
          .status(400)
          .json({ message: "Each subject must have a valid name" });
      }
      if (typeof sub.marks !== "number") {
        return res
          .status(400)
          .json({ message: "Each subject must have marks as a number" });
      }
    }

    // Auto-calc total if not provided
    const calculatedTotal = subjects.reduce((sum, sub) => sum + sub.marks, 0);
    const finalTotal = total ?? calculatedTotal;

    const newScore = await TestScore.create({
      rollNumber,
      student,
      father,
      batch,
      subjects,
      percentile,
      total: finalTotal,
      rank,
      date: parseDate(date) || new Date(),
      name,
    });

    res.status(201).json(newScore);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating test score", error: err.message });
  }
};

// Get all test scores
exports.getAllTestScores = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const skip = (page - 1) * limit;

    const total = await TestScore.countDocuments();
    const scores = await TestScore.find()
      .populate("batch")
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      data: scores,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching test scores",
      error: err.message,
    });
  }
};

// Get single test score by ID
exports.getTestScoreById = async (req, res) => {
  try {
    const score = await TestScore.findById(req.params.id).populate("batch");
    if (!score) return res.status(404).json({ message: "Score not found" });
    res.status(200).json(score);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching score", error: err.message });
  }
};

// Get all scores by student name
exports.getScoresByStudent = async (req, res) => {
  try {
    const studentName = req.params.student.toLowerCase().trim();
    const scores = await TestScore.find({ student: studentName }).populate(
      "batch"
    );
    res.status(200).json(scores);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching scores", error: err.message });
  }
};

// Update a test score
exports.updateTestScore = async (req, res) => {
  try {
    const updated = await TestScore.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Score not found" });
    res.status(200).json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating score", error: err.message });
  }
};

// Delete a test score
exports.deleteTestScore = async (req, res) => {
  try {
    const deleted = await TestScore.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Score not found" });
    res.status(200).json({ message: "Score deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting score", error: err.message });
  }
};

exports.searchTestScore = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(query, "i");
    const orConditions = [{ student: regex }, { batch: regex }];
    // Only add rollNumber if query is a valid number
    if (!isNaN(query)) {
      orConditions.push({ rollNumber: Number(query) });
    }
    // For date, try to match if query is a valid date string
    const dateQuery = new Date(query);
    if (!isNaN(dateQuery.getTime())) {
      // Search for exact date (ignoring time)
      const start = new Date(dateQuery.setHours(0, 0, 0, 0));
      const end = new Date(dateQuery.setHours(23, 59, 59, 999));
      orConditions.push({ date: { $gte: start, $lte: end } });
    }
    const scores = await TestScore.find({ $or: orConditions });
    if (scores.length === 0) {
      return res.status(404).json({ message: "No test scores found" });
    }
    res.status(200).json(scores);
  } catch (err) {
    console.error("Error searching test scores:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getNumberOfStudentsAttendedTheTest = async (req, res) => {
  try {
    const { testName, date } = req.query;
    console.log("testName:", testName, "date:", date);

    if (!testName || !date) {
      return res.status(400).json({
        message: "testName and date query parameters are required",
      });
    }

    const range = parseDateRange(date);
    if (!range) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const count = await TestScore.countDocuments({
      name: testName.toLowerCase().trim(),
      date: { $gte: range.startOfDay, $lte: range.endOfDay },
    });

    res.status(200).json({ numberOfStudents: count });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching number of students",
      error: err.message,
    });
  }
};

exports.getAllTestScoresByRollNumber = async (req, res) => {
  try {
    const rollNumber = parseInt(req.params.rollNumber, 10);

    if (isNaN(rollNumber)) {
      return res
        .status(400)
        .json({ message: "Roll number must be a valid number" });
    }

    const scores = await TestScore.find({ rollNumber }).sort({
      percentile: -1,
      date: -1,
    });

    if (!scores || scores.length === 0) {
      return res
        .status(404)
        .json({ message: "No scores found for this roll number" });
    }

    res.status(200).json(scores);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching scores by roll number",
      error: err.message,
    });
  }
};
