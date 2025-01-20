const User = require("../models/user"); // For Vendors (user table)
const Employee = require("../models/employees"); // For Employees (employee table)
const bcrypt = require("bcrypt");

exports.signin = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    let user;

    // Handle Vendor login (check user table)
    if (role === "Vendor") {
      user = await User.findOne({ email });
    }
    // Handle Employee login (check employee table)
    else if (role === "Employee") {
      user = await Employee.findOne({ email });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Respond with user details (include role for front-end handling)
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res.status(500).json({ message: "Server error" });
  }
};
