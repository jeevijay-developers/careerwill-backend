// controllers/batchController.js
const Batch = require("../models/Batch");
const Student = require("../models/Student");

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
exports.getAllBatchesName = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ startDate: -1 });

    const BATCH_NAMES = batches.map((b) => {
      if (b.name && b.name !== "") return b.name.toUpperCase();
    });
    res.status(200).json(["ALL", ...BATCH_NAMES]);
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

// @desc    Get all unique batches from student collection
exports.getAllStudentBatches = async (req, res) => {
  try {
    const batches = await Student.distinct("batch");

    // Filter out null, undefined, empty strings and "N/A"
    const filteredBatches = batches.filter(
      (batch) => batch && batch !== "" && batch.toUpperCase() !== "N/A"
    );

    // Sort alphabetically
    filteredBatches.sort();

    res.status(200).json({
      success: true,
      count: filteredBatches.length,
      batches: filteredBatches,
    });
  } catch (err) {
    console.error("Error fetching student batches:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Sync batches from Student collection to Batch collection
exports.syncBatches = async (req, res) => {
  try {
    // 1. Fetch all distinct batches from Student collection
    const studentBatches = await Student.distinct("batch");

    // Filter out null, undefined, empty strings and "N/A"
    const filteredStudentBatches = studentBatches.filter(
      (batch) => batch && batch !== "" && batch.toUpperCase() !== "N/A"
    );

    // 2. Fetch all existing batch names from Batch collection
    const existingBatches = await Batch.find({}, "name").lean();
    const existingBatchNames = existingBatches.map((batch) =>
      batch.name.toLowerCase()
    );

    // 3. Find batches that exist in Student but not in Batch collection
    const missingBatches = filteredStudentBatches.filter(
      (studentBatch) => !existingBatchNames.includes(studentBatch.toLowerCase())
    );

    // 4. Create new Batch objects for missing batches
    const newBatches = [];
    const createdBatches = [];

    if (missingBatches.length > 0) {
      for (const batchName of missingBatches) {
        const newBatch = {
          name: batchName.toLowerCase(),
          class: "N/A", // Default class since we don't have this info from Student
          startDate: new Date(), // Default to current date
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
        };
        newBatches.push(newBatch);
      }

      // Insert all new batches
      const insertedBatches = await Batch.insertMany(newBatches);
      createdBatches.push(...insertedBatches);
    }

    res.status(200).json({
      success: true,
      message: `Batch sync completed successfully`,
      summary: {
        totalStudentBatches: filteredStudentBatches.length,
        existingBatches: existingBatchNames.length,
        newBatchesCreated: createdBatches.length,
        studentBatches: filteredStudentBatches,
        missingBatches: missingBatches,
        createdBatches: createdBatches,
      },
    });
  } catch (err) {
    console.error("Error syncing batches:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// @desc    Sync batches from Student collection to Batch collection
exports.syncBatchesFunct = async () => {
  try {
    // 1. Fetch all distinct batches from Student collection
    const studentBatches = await Student.distinct("batch");

    // Filter out null, undefined, empty strings and "N/A"
    const filteredStudentBatches = studentBatches.filter(
      (batch) => batch && batch !== "" && batch.toUpperCase() !== "N/A"
    );

    // 2. Fetch all existing batch names from Batch collection
    const existingBatches = await Batch.find({}, "name").lean();
    const existingBatchNames = existingBatches.map((batch) =>
      batch.name.toLowerCase()
    );

    // 3. Find batches that exist in Student but not in Batch collection
    const missingBatches = filteredStudentBatches.filter(
      (studentBatch) => !existingBatchNames.includes(studentBatch.toLowerCase())
    );

    // 4. Create new Batch objects for missing batches
    const newBatches = [];
    const createdBatches = [];

    if (missingBatches.length > 0) {
      for (const batchName of missingBatches) {
        const newBatch = {
          name: batchName.toLowerCase(),
          class: "N/A", // Default class since we don't have this info from Student
          startDate: new Date(), // Default to current date
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
        };
        newBatches.push(newBatch);
      }

      // Insert all new batches
      const insertedBatches = await Batch.insertMany(newBatches);
      createdBatches.push(...insertedBatches);
    }

    return true;
  } catch (err) {
    console.error("Error syncing batches:", err);
    return false;
  }
};
