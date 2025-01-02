// routes/jobFormRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multerSetup"); // Import your existing multer setup
const {
  createJobForm,
  getAllJobForms,
  getJobFormById,
  updateJobForm,
  deleteJobForm,
} = require("../controllers/jobFormController");

// Routes
router.post("/", upload.single("resume"), createJobForm);
router.get("/", getAllJobForms); // Get all job forms
router.get("/:id", getJobFormById); // Get job form by ID
router.put("/:id", upload.single("resume"), updateJobForm); // Update job form
router.delete("/:id", deleteJobForm); // Delete job form

module.exports = router;
