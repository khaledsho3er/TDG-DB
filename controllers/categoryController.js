const Category = require("../models/category");

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const category = new Category({ name, description, image });
    await category.save();
    res
      .status(201)
      .json({ message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Error creating category", error });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching categories", error });
    console.log("Error fetching categories:", error);
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name, description, image },
      { new: true }
    );

    res.status(200).json({ message: "Category updated", updatedCategory });
  } catch (error) {
    res.status(500).json({ message: "Error updating category", error });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting category", error });
  }
};
