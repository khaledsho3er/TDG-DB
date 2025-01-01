// controllers/jobFormController.js
const JobForm = require("../models/jobForm");

// Create a new job form
exports.createJobForm = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log incoming form data
    console.log("Uploaded File:", req.file); // Log file details

    if (!req.file) {
      return res.status(400).json({ error: "Resume file is required" });
    }

    // Assume we save the form data to the database here
    const formData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address,
      country: req.body.country,
      city: req.body.city,
      linkedInURL: req.body.linkedInURL,
      notes: req.body.notes,
      resume: req.file.path,
    };

    console.log("Form Data to Save:", formData);

    // Save form data to the database (replace with actual DB save logic)
    const jobForm = await JobForm.create(formData);

    res
      .status(201)
      .json({ message: "Job form submitted successfully", jobForm });
  } catch (error) {
    console.error("Error in createJobForm:", error); // Log the error
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
};

// Get all job forms
exports.getAllJobForms = async (req, res) => {
  try {
    const jobForms = await JobForm.find();
    res.status(200).json(jobForms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching job forms", error });
  }
};

// Get a specific job form by ID
exports.getJobFormById = async (req, res) => {
  try {
    const { id } = req.params;
    const jobForm = await JobForm.findById(id);

    if (!jobForm) {
      return res.status(404).json({ message: "Job form not found" });
    }

    res.status(200).json(jobForm);
  } catch (error) {
    res.status(500).json({ message: "Error fetching job form", error });
  }
};

// Update a job form
exports.updateJobForm = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    if (req.file) {
      updatedData.resume = req.file.path; // Update resume if a new file is uploaded
    }

    const updatedJobForm = await JobForm.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedJobForm) {
      return res.status(404).json({ message: "Job form not found" });
    }

    res.status(200).json(updatedJobForm);
  } catch (error) {
    res.status(500).json({ message: "Error updating job form", error });
  }
};

// Delete a job form
exports.deleteJobForm = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedJobForm = await JobForm.findByIdAndDelete(id);

    if (!deletedJobForm) {
      return res.status(404).json({ message: "Job form not found" });
    }

    res.status(200).json({ message: "Job form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job form", error });
  }
};
