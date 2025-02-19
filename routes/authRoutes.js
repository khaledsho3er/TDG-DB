const express = require("express");
const {
  signin,
  sendOTP,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// POST route for user sign-in (both Vendor and Employee)
router.post("/signin-emp", signin);
router.post("/forgot-password", sendOTP);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
