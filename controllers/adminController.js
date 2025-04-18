// controllers/adminController.js
const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register a new admin
// signup admin
exports.signupAdmin = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existing = await Admin.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ username, email, password: hashed });
    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login admin
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res
      .status(200)
      .json({
        token,
        admin: { id: admin._id, username: admin.username, role: admin.role },
      });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Example: Get admin profile
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
