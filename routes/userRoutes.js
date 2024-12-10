const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();

// Sign Up Route
router.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phoneNumber,
    address1,
    address2,
    dateOfBirth,
    gender,
    language,
    region,
    shipmentAddress,
  } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Required fields are missing!" });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use." });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      address1,
      address2,
      dateOfBirth,
      gender: "Other",
      language,
      region,
      shipmentAddress,
    });

    const savedUser = await newUser.save();
    res.status(201).json({
      message: "User created successfully",
      user: { id: savedUser._id, email: savedUser.email },
    });
  } catch (error) {
    console.error("Error signing up user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sign In Route
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the entered password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token with the secret key from the environment variable
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expiry (you can adjust this time)
    });

    // Send response with the token and user info
    res.status(200).json({
      message: "User logged in successfully",
      token: token,
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
