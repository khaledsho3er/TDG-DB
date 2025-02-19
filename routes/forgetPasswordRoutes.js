const express = require("express");
const {
  sendOTP,
  verifyOtp,
  resetPassword,
} = require("../controllers/forgetPasswordController");

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
