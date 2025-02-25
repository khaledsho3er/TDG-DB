const User = require("../models/user"); // For Vendors (user table)
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");
const otpStore = {}; // Temporary storage for OTPs (use Redis in production)
const jwt = require("jsonwebtoken");

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
  console.log("Generated OTP:", otp); // 🟢 Log OTP
  console.log("User before saving OTP:", user); // 🟢 Log user object
  otpStore[email] = { otp, expiresAt: Date.now() + 300000 }; // Expires in 5 minutes
  // Store OTP in MongoDB
  await User.findByIdAndUpdate(user._id, {
    otp,
    otpCreatedAt: Date.now(),
  });
  await transporter.sendMail({
    from: "karimwahba53@gmail.com",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}`,
  });

  res.json({ message: "OTP sent to email" });
};
// exports.verifyOtp = async (req, res) => {
//   const { email, otp } = req.body;

//   console.log("Received Email:", email, "Received OTP:", otp); // 🟢 Log received data

//   const user = await User.findOne({ email });

//   if (!user) {
//     console.log("User not found in database"); // 🛑 Log issue
//     return res.status(400).json({ error: "User not found" });
//   }

//   console.log("Stored OTP:", user.otp, "Received OTP:", otp); // 🟢 Log OTP comparison

//   if (!user.otp) {
//     return res.status(400).json({ error: "OTP not generated or expired" });
//   }

//   const otpExpirationTime = 5 * 60 * 1000; // 5 minutes
//   if (Date.now() - user.otpCreatedAt > otpExpirationTime) {
//     return res.status(400).json({ error: "OTP expired" });
//   }

//   if (user.otp !== otp.toString()) {
//     return res.status(400).json({ error: "Invalid OTP" });
//   }

//   // Clear OTP after successful verification
//   user.otp = null;
//   user.otpCreatedAt = null;
//   await user.save();

//   res.json({ message: "OTP verified successfully" });
// };
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ error: "User not found" });

  if (!user.otp || user.otp !== otp.toString()) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  // OTP is valid, generate a reset token
  const resetToken = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Store reset token in the database
  user.resetToken = resetToken;
  user.otp = null; // Clear OTP
  user.otpCreatedAt = null;
  await user.save();

  res.json({ message: "OTP verified successfully", resetToken });
};
// 3. Reset Password
// exports.resetPassword = async (req, res) => {
//   const { email, newPassword } = req.body;
//   const hashedPassword = await bcrypt.hash(newPassword, 10);

//   await User.findOneAndUpdate({ email }, { password: hashedPassword });
//   await transporter.sendMail({
//     from: "karimwahba53@gmail.com",
//     to: email,
//     subject: "Password has been reset successfully.",
//     text: `Your password has been reset successfully. Welcome Back to The Design Grit!`,
//   });
//   res.json({ message: "Password reset successful" });
// };
exports.resetPassword = async (req, res) => {
  const { email, newPassword, token } = req.body;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token expires at:", new Date(decoded.exp * 1000));
    if (decoded.email !== email) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const user = await User.findOne({ email });
    if (!user || user.resetToken !== token) {
      return res.status(401).json({ error: "Unauthorized or expired token" });
    }
    console.log("Received token:", token);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null; // Clear the reset token
    await user.save();
    await transporter.sendMail({
      from: "karimwahba53@gmail.com",
      to: email,
      subject: "Password has been reset successfully.",
      text: `Your password has been reset successfully. Welcome Back to The Design Grit!`,
    });
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
