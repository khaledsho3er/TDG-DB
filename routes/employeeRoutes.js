// routes/employeeRoutes.js

const express = require("express");
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

// Create Employee
router.post("/signup-employee", createEmployee);

// Get All Employees
router.get("/getAll", getAllEmployees);

// Get Employee by ID
router.get("/employee/:id", getEmployeeById);

// Update Employee
router.put("/employee/:id", updateEmployee);

// Delete Employee
router.delete("/employee/:id", deleteEmployee);

module.exports = router;
