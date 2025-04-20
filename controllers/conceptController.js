const ConceptImage = require("../models/conceptImages");
const mongoose = require("mongoose");

// CREATE: Add a new concept image
const createConceptImage = async (req, res) => {
  try {
    console.log("Incoming POST request body:", req.body);
    console.log("Uploaded file info:", req.file);

    const { title, description, nodes } = req.body;

    if (!req.file || !req.file.key) {
      return res.status(400).json({
        success: false,
        message: "Image file is required.",
      });
    }

    let parsedNodes = [];
    try {
      parsedNodes = nodes ? JSON.parse(nodes) : [];
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON format for nodes.",
      });
    }

    const newConceptImage = new ConceptImage({
      title,
      description,
      imageUrl: req.file.key,
      nodes: parsedNodes,
    });

    await newConceptImage.save();
    res.status(201).json({ success: true, concept: newConceptImage });
  } catch (error) {
    console.error("❌ Error in createConceptImage:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET all concepts
const getAllConceptImages = async (req, res) => {
  try {
    const concepts = await ConceptImage.find()
      .populate("nodes.productId")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("type", "name")
      .populate("brandId", "brandName");
    res.status(200).json({ success: true, concepts });
  } catch (error) {
    console.error("❌ Error in getAllConceptImages:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET one concept by ID
const getConceptImageById = async (req, res) => {
  try {
    const concept = await ConceptImage.findById(req.params.id)
      .populate("nodes.productId")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("type", "name")
      .populate("brandId", "brandName");
    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found." });
    }
    res.status(200).json({ success: true, concept });
  } catch (error) {
    console.error("❌ Error in getConceptImageById:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// UPDATE concept image
const updateConceptImage = async (req, res) => {
  try {
    const { title, description, nodes } = req.body;
    const concept = await ConceptImage.findById(req.params.id);

    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found." });
    }

    let parsedNodes = concept.nodes;
    try {
      parsedNodes = nodes ? JSON.parse(nodes) : concept.nodes;
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid JSON format for nodes." });
    }

    concept.title = title || concept.title;
    concept.description = description || concept.description;
    concept.nodes = parsedNodes;

    if (req.file && req.file.key) {
      concept.imageUrl = req.file.key;
    }

    await concept.save();
    res.status(200).json({ success: true, concept });
  } catch (error) {
    console.error("❌ Error in updateConceptImage:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE concept image
const deleteConceptImage = async (req, res) => {
  try {
    const concept = await ConceptImage.findByIdAndDelete(req.params.id);
    if (!concept) {
      return res
        .status(404)
        .json({ success: false, message: "Concept not found." });
    }

    res.status(200).json({ success: true, message: "Concept deleted." });
  } catch (error) {
    console.error("❌ Error in deleteConceptImage:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  createConceptImage,
  getAllConceptImages,
  getConceptImageById,
  updateConceptImage,
  deleteConceptImage,
};
