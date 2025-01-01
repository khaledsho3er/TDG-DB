const FAQ = require("../models/faq");

// Create a new FAQ
const createFAQ = async (req, res) => {
  try {
    const { category, question, answer } = req.body;

    if (!category || !question || !answer) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newFAQ = new FAQ({ category, question, answer });
    await newFAQ.save();
    res.status(201).json({ message: "FAQ created successfully.", faq: newFAQ });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error creating FAQ", details: error.message });
  }
};

// Fetch all FAQs
const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find();
    res.status(200).json(faqs);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching FAQs", details: error.message });
  }
};

// Fetch a single FAQ by ID
const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findById(id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found." });
    }

    res.status(200).json(faq);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching FAQ", details: error.message });
  }
};

// Update an FAQ by ID
const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, question, answer } = req.body;

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      { category, question, answer },
      { new: true, runValidators: true }
    );

    if (!updatedFAQ) {
      return res.status(404).json({ message: "FAQ not found." });
    }

    res
      .status(200)
      .json({ message: "FAQ updated successfully.", faq: updatedFAQ });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error updating FAQ", details: error.message });
  }
};

// Delete an FAQ by ID
const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFAQ = await FAQ.findByIdAndDelete(id);

    if (!deletedFAQ) {
      return res.status(404).json({ message: "FAQ not found." });
    }

    res.status(200).json({ message: "FAQ deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error deleting FAQ", details: error.message });
  }
};

module.exports = {
  createFAQ,
  getAllFAQs,
  getFAQById,
  updateFAQ,
  deleteFAQ,
};
