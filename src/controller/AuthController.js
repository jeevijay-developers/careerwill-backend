const User = require("../models/User");
const { comparePassword } = require("../middleware/bcrypt");
const { generateToken } = require("../middleware/jwt");

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    // console.log(user);

    const comparedPassword = await comparePassword(password, user.password);
    if (!comparedPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = await generateToken(user);
    return res.status(200).json({ message: "Login successful", token: token, user });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.signUp = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.findOne({ email });
    console.log("We are here");

    if (user) return res.status(409).json({ message: "User already exists" });

    const USER = User.create({
      name,
      email,
      password,
      role,
    });
    res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.log("Cannot create account", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.log("Cannot fetch users", error);
    return res.status(500).json({ message: "Server error" });
  }
};
