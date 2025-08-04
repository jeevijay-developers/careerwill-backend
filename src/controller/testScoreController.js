const Student = require("../models/Student");
const TestScore = require("../models/TestScore");

// Create new test score
exports.createTestScore = async (req, res) => {
  try {
    const newScore = await TestScore.create(req.body);
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
