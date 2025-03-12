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
// Update a tag
exports.updateTag = async (req, res) => {
  try {
    const updatedTag = await Tag.findOneAndUpdate(
      { _id: req.params._id },
      req.body,
      { new: true }
    );
    res.json(updatedTag);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
// Get tags by category
exports.getTagsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    const validCategories = [
      "Color",
      "Style",
      "Material",
      "Finish",
      "Size",
      "Shape",
      "Functionality",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const tags = await Tag.find({ category });

    res.status(200).json(tags);
  } catch (error) {
    console.error("Error fetching tags by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};
