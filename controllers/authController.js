const User = require("../models/user"); // For Vendors (user table)
const Employee = require("../models/employees"); // For Employees (employee table)
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.signin = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user;

    if (role === "Vendor") {
      user = await User.findOne({ email });
    } else if (role === "Employee") {
      user = await Employee.findOne({ email }).select(
        "_id email role tier password"
      );
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password exists before comparing
    const isPasswordValid = user.password
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Include tier only for Employees
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        tier: role === "Employee" ? user.tier : undefined, // Only include for Employees
      },
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "karimwahba53@gmail.com",
    pass: "lryi gnbd gcew gkpj",
  },
});
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = crypto.randomInt(100000, 999999).toString();
  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins expiry
  await user.save();

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return res.status(500).json({ message: "Email sending failed" });
    res.json({ message: "OTP sent successfully" });
  });
};
exports.verifyOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.password = newPassword; // Hash password before saving in production
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ message: "Password updated successfully" });
};
