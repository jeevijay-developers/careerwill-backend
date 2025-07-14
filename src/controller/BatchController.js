// controllers/batchController.js
const Batch = require("../models/Batch");

// @desc    Create a new batch
exports.createBatch = async (req, res) => {
  try {
    const { name, class: className, startDate, endDate } = req.body;

    if (!name || !className || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await Batch.findOne({ name, class: className, startDate });
    if (existing) {
      return res.status(409).json({
        message: "Batch with same name/class/startDate already exists.",
      });
    }

    const batch = await Batch.create({
      name,
      class: className,
      startDate,
      endDate,
    });

    res.status(201).json({ message: "Batch created", batch });
  } catch (err) {
    console.error("Error creating batch:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get all batches
exports.getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ startDate: -1 });
    res.status(200).json(batches);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get single batch by ID
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    res.status(200).json(batch);
  } catch (err) {
    console.error("Error fetching batch:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update batch
exports.updateBatch = async (req, res) => {
  try {
    const updated = await Batch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Batch not found" });
    res.status(200).json({ message: "Batch updated", batch: updated });
  } catch (err) {
    console.error("Error updating batch:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Delete batch
exports.deleteBatch = async (req, res) => {
  try {
    const deleted = await Batch.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Batch not found" });

    res.status(200).json({ message: "Batch deleted successfully" });
  } catch (err) {
    console.error("Error deleting batch:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
