const User = require("../models/User");

exports.createUser = async (req, res) => {
    const { username, email, password, phone, role } = req.body;

    try {
        // Validate input
        if (!username || !email || !phone || !role || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Create user logic here
        const response = await User.create({ username, email, phone, role, password });
        if(!response) {
            return res.status(500).json({ message: "Failed to create user" });
        }
        return res.status(201).json({ message: "User created successfully", User: response });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ message: "Internal server error while creating user" });
    }
}