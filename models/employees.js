// models/Employee.js

const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
  role: { type: String, enum: ["Employee"], default: "Employee" },
  tier: { type: String, enum: ["1", "2", "3"], required: true }, // Authority levels
});

module.exports = mongoose.model("Employee", EmployeeSchema);
