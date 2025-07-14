const Kit = require("../models/Kit");

// Create new kit
exports.createKit = async (req, res) => {
  try {
    const { name, description } = req.body;
    // console.log("Creating kit with data:", req.body);
    
    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required." });
    }

    const newKit = await Kit.create({ name, description });
    // console.log("New kit created:", newKit);
    
    return res.status(201).json(newKit);
  } catch (err) {
    res.status(500).json({ message: "Error creating kit", error: err.message });
  }
};

// Get all kits
exports.getAllKits = async (req, res) => {
  try {
    const kits = await Kit.find().sort({ createdAt: -1 });
    res.status(200).json(kits);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching kits", error: err.message });
  }
};

// Get single kit by ID
exports.getKitById = async (req, res) => {
  try {
    const kit = await Kit.findById(req.params.id);
    if (!kit) return res.status(404).json({ message: "Kit not found" });
    res.status(200).json(kit);
  } catch (err) {
    res.status(500).json({ message: "Error fetching kit", error: err.message });
  }
};

// Update kit
exports.updateKit = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedKit = await Kit.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );
    if (!updatedKit) return res.status(404).json({ message: "Kit not found" });
    res.status(200).json(updatedKit);
  } catch (err) {
    res.status(500).json({ message: "Error updating kit", error: err.message });
  }
};

// Delete kit
exports.deleteKit = async (req, res) => {
  try {
    const deletedKit = await Kit.findByIdAndDelete(req.params.id);
    if (!deletedKit) return res.status(404).json({ message: "Kit not found" });
    res.status(200).json({ message: "Kit deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting kit", error: err.message });
  }
};
