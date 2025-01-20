const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const {
  isAuthenticated,
  isAuthorized,
} = require("../middlewares/authMiddleware");

const router = express.Router();
router.get("/api/vendor/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  try {
    const vendor = await User.findById(vendorId).populate("financials"); // Fetch vendor with financials

    if (!vendor) return res.status(404).json({ message: "Vendor not found!" });

    res.status(200).json(vendor);
  } catch (error) {
    res.status(500).json({ message: "Server error!" });
  }
});
