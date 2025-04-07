const ConceptImage = require("../models/conceptImages"); // Assuming model path
const upload = require("../middlewares/conceptsMulter"); // Multer configuration
const mongoose = require("mongoose");

// CREATE: Add a new concept image
const createConceptImage = async (req, res) => {
  try {
    const { title, description, nodes } = req.body;

    // Check if an image was uploaded
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image is required." });
    }

    // Save concept image in the database (only storing the image name)
    const newConceptImage = new ConceptImage({
      title,
      description,
      imageUrl: req.file.key, // Save the image file name (key) in the database
      nodes: JSON.parse(nodes) || [], // Convert string to array if necessary
    });

    await newConceptImage.save();
    res.status(201).json({ success: true, concept: newConceptImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET: Get all concept images
const getAllConceptImages = async (req, res) => {
  try {
    const concepts = await ConceptImage.find().populate("nodes.productId");
    res.status(200).json({ success: true, concepts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET: Get a single concept image by ID
const getConceptImageById = async (req, res) => {
  try {
    const concept = await ConceptImage.findById(req.params.id).populate(
      "nodes.productId"
    );
    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found" });
    }
    res.status(200).json({ success: true, concept });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT: Edit a concept image by ID
const updateConceptImage = async (req, res) => {
  try {
    const { title, description, nodes } = req.body;
    const concept = await ConceptImage.findById(req.params.id);

    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found" });
    }

    // Update concept fields
    concept.title = title || concept.title;
    concept.description = description || concept.description;
    concept.nodes = JSON.parse(nodes) || concept.nodes;

    // If a new image is uploaded, update the imageUrl field
    if (req.file) {
      concept.imageUrl = req.file.key; // Save new image name in the database
    }

    await concept.save();
    res.status(200).json({ success: true, concept });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE: Delete a concept image by ID
const deleteConceptImage = async (req, res) => {
  try {
    const concept = await ConceptImage.findById(req.params.id);

    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found" });
    }

    await concept.remove();
    res.status(200).json({ success: true, message: "Concept deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createConceptImage,
  getAllConceptImages,
  getConceptImageById,
  updateConceptImage,
  deleteConceptImage,
};
