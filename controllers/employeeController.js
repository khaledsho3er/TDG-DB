// controllers/employeeController.js

const Employee = require("../models/employees");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");

// Create Employee (with email notification)
// controllers/employeeController.js

exports.createEmployee = async (req, res) => {
  try {
    const { name, employeeNumber, email, phoneNumber, password, tier } =
      req.body;

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee
    const newEmployee = new Employee({
      name,
      employeeNumber,
      email,
      phoneNumber,
      password: hashedPassword,
      tier,
    });

    // Save employee
    await newEmployee.save();

    // Send email notification to the employee
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "your-email@gmail.com",
        pass: "your-email-password",
      },
    });

    const mailOptions = {
      from: "karimwahba63@gmail.com",
      to: email,
      subject: "Welcome to the Portal",
      text: `Hello ${name},\n\nYour account has been successfully created. You have been assigned Tier ${tier} authority. Please log in to access the employee portal.\n\nRegards,\nCompany Name`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send("Failed to send email.");
      }
      res.status(201).json({
        message: "Employee created successfully",
        employee: newEmployee,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get All Employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(200).json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update Employee
exports.updateEmployee = async (req, res) => {
  try {
    const { name, employeeNumber, email, phoneNumber, password, tier } =
      req.body;

    // Hash the password if it's being updated
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        name,
        employeeNumber,
        email,
        phoneNumber,
        password: hashedPassword,
        tier,
      },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.status(200).json(updatedEmployee);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
