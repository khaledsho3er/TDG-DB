const express = require("express");
const router = express.Router();
const {
  createFAQ,
  getAllFAQs,
  getFAQById,
  updateFAQ,
  deleteFAQ,
} = require("../controllers/faqController");

// Create a new FAQ
router.post("/", createFAQ);

// Get all FAQs
router.get("/", getAllFAQs);

// Get a specific FAQ by ID
router.get("/:id", getFAQById);

// Update an FAQ by ID
router.put("/:id", updateFAQ);

// Delete an FAQ by ID
router.delete("/:id", deleteFAQ);

module.exports = router;
