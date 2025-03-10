const Tag = require("../models/tag");

// Create a new tag
exports.createTag = async (req, res) => {
  try {
    const { name, category } = req.body;
    const tag = new Tag({ name, category });
    await tag.save();
    res.status(201).json({ message: "Tag created successfully", tag });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all tags
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a tag
exports.deleteTag = async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
