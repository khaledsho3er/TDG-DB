const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");

// Route to create a new job
router.post("/", jobController.createJob);

// Route to get all jobs
router.get("/", jobController.getAllJobs);

// Route to get a specific job by ID
router.get("/:id", jobController.getJobById);

// Route to update a job by ID
router.put("/:id", jobController.updateJob);

// Route to delete a job by ID
router.delete("/:id", jobController.deleteJob);

module.exports = router;
