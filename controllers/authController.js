const User = require("../models/user"); // For Vendors (user table)
const Employee = require("../models/employees"); // For Employees (employee table)
const bcrypt = require("bcrypt");

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
