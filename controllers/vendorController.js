const Vendor = require("../models/vendor");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "your_secret_key"; // Replace with a secure secret

// Signup
exports.signup = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    employeeNumber,
    password,
    phoneNumber,
    tier,
    brandId,
  } = req.body;

  try {
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: "Vendor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newVendor = new Vendor({
      firstName,
      lastName,
      email,
      employeeNumber,
      password: hashedPassword,
      phoneNumber,
      tier,
      brandId,
    });

    await newVendor.save();
    res.status(201).json({ message: "Vendor created successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, vendor.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Store vendor information in the session
    req.session.vendor = {
      id: vendor._id,
      email: vendor.email,
      tier: vendor.tier,
      role: vendor.role,
      brandId: vendor.brandId,
    };

    res.status(200).json({
      message: "Login successful",
      vendor: {
        id: vendor._id,
        email: vendor.email,
        tier: vendor.tier,
        role: vendor.role,
        brandId: vendor.brandId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.status(200).json({ message: "Logout successful" });
  });
};

// Get all vendors
exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single vendor
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.status(200).json({ message: "Vendor updated successfully", vendor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete vendor
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
