const express = require("express");
const BillingInfo = require("../models/billingInfo");
const isAuthenticated = require("../middlewares/authMiddleware");

const router = express.Router();

// Endpoint to add billing info
router.post("/add", isAuthenticated, async (req, res) => {
  try {
    const { cardNumber, cardNameHolder, expirationDate, cvv } = req.body;

    // Validate the incoming data
    if (!cardNumber || !cardNameHolder || !expirationDate || !cvv) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Log incoming request for debugging
    console.log("Request Body:", req.body);
    console.log("Authenticated User ID:", req.user.id);

    const hashedCVV = await bcrypt.hash(cvv, 10); // Hash CVV for security

    const billingInfo = new BillingInfo({
      cardNumber,
      cardNameHolder,
      expirationDate,
      cvv: hashedCVV, // Save the hashed CVV
      userId: req.user.id, // Link the billing info to the authenticated user
    });

    await billingInfo.save();
    res.status(201).json({ message: "Billing info added successfully" });
  } catch (error) {
    console.error("Error adding billing info:", error);
    res
      .status(500)
      .json({ message: "Error adding billing info", error: error.message });
  }
});

// Endpoint to get billing info
router.get("/", isAuthenticated, async (req, res) => {
  try {
    // Log the user ID to confirm authentication
    console.log("Fetching billing info for user ID:", req.user.id);

    const billingInfo = await BillingInfo.find({ userId: req.user.id });
    if (!billingInfo) {
      return res.status(404).json({ message: "No billing info found" });
    }
    res.status(200).json(billingInfo);
  } catch (error) {
    console.error("Error fetching billing info:", error);
    res
      .status(500)
      .json({ message: "Error fetching billing info", error: error.message });
  }
});

module.exports = router;
