const User = require("../models/User");

exports.updateRole = async (req, res) => {
  const { userId, newRole } = req.body;

  if (!userId || !newRole) {
    return res.status(400).json({ error: "User ID and new role are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.role = newRole;
    await user.save();

    return res.status(200).json({ message: "User role updated successfully" });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.updatePhone = async (req, res) => {
  const { userId, newPhone } = req.body;

  if (!userId || !newPhone) {
    return res
      .status(400)
      .json({ error: "User ID and new phone number are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // check if the new phone number is already in use
    const existingUser = await User.findOne({ phone: newPhone });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({ error: "Phone number already in use" });
    }
    user.phone = newPhone;
    await user.save();

    return res
      .status(200)
      .json({ message: "User phone number updated successfully" });
  } catch (error) {
    console.error("Error updating user phone number:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
