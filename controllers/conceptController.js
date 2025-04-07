const Concept = require("../models/conceptImages");

// Create Concept
const createConcept = async (req, res) => {
  try {
    const { title, description, brandId } = req.body;

    const imageUrl = req.file?.location;

    const concept = new Concept({
      title,
      description,
      imageUrl,
      brand: brandId, // Make sure to store brand reference
    });

    await concept.save();

    res.status(201).json({ success: true, concept });
  } catch (error) {
    console.error("Error creating concept:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get All Concepts
const getAllConcepts = async (req, res) => {
  try {
    const concepts = await Concept.find().populate("brand"); // Populates brand info

    res.status(200).json({ success: true, concepts });
  } catch (error) {
    console.error("Error fetching concepts:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get One Concept by ID
const getOneConcept = async (req, res) => {
  try {
    const { id } = req.params;

    const concept = await Concept.findById(id).populate("brand");

    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found" });
    }

    res.status(200).json({ success: true, concept });
  } catch (error) {
    console.error("Error getting concept:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Edit Concept
const editConcept = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, brandId } = req.body;

    const concept = await Concept.findById(id);
    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found" });
    }

    // Update fields
    concept.title = title || concept.title;
    concept.description = description || concept.description;
    concept.brand = brandId || concept.brand;

    // Update image if new one provided
    if (req.file) {
      concept.imageUrl = req.file.location;
    }

    await concept.save();

    res.status(200).json({ success: true, concept });
  } catch (error) {
    console.error("Error editing concept:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete Concept
const deleteConcept = async (req, res) => {
  try {
    const { id } = req.params;

    const concept = await Concept.findByIdAndDelete(id);
    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found" });
    }

    res.status(200).json({ success: true, message: "Concept deleted" });
  } catch (error) {
    console.error("Error deleting concept:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createConcept,
  getAllConcepts,
  getOneConcept,
  editConcept,
  deleteConcept,
};
