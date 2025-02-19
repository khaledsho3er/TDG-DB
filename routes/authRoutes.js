const express = require("express");
const {
  signin,
  forgotPassword,
  verifyOtp,
} = require("../controllers/authController");

const router = express.Router();

// POST route for user sign-in (both Vendor and Employee)
router.post("/signin-emp", signin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
module.exports = router;
