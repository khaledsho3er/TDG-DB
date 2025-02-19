const User = require("../models/user"); // For Vendors (user table)
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const otpStore = {}; // Temporary storage for OTPs (use Redis in production)

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "karimwahba53@gmail.com",
    pass: "lryi gnbd gcew gkpj",
  },
});
exports.sendOTP = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
  });

  otpStore[email] = { otp, expiresAt: Date.now() + 300000 }; // Expires in 5 minutes

  await transporter.sendMail({
    from: "karimwahba53@gmail.com",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}`,
  });

  res.json({ message: "OTP sent to email" });
};
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user) return res.status(400).json({ error: "User not found" });

  console.log("Stored OTP:", user.otp, "Received OTP:", otp);

  const otpExpirationTime = 5 * 60 * 1000; // 5 minutes
  if (Date.now() - user.otpCreatedAt > otpExpirationTime) {
    return res.status(400).json({ error: "OTP expired" });
  }

  if (user.otp !== otp.toString()) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  user.otp = null; // Invalidate OTP after use
  res.json({ message: "OTP verified successfully" });
};
// 3. Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await User.findOneAndUpdate({ email }, { password: hashedPassword });

  res.json({ message: "Password reset successful" });
};
