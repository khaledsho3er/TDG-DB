const SubCategory = require("../models/subCategory");

exports.createSubCategory = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !categoryId) {
      return res
        .status(400)
        .json({ message: "Name and Category ID are required" });
    }

    const subCategory = new SubCategory({
      name,
      description,
      image,
      categoryId,
    });
    await subCategory.save();
    res
      .status(201)
      .json({ message: "SubCategory created successfully", subCategory });
  } catch (error) {
    res.status(500).json({ message: "Error creating subCategory", error });
  }
};

exports.getSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find().populate(
      "categoryId",
      "name"
    );
    res.status(200).json(subCategories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching subCategories", error });
  }
};

exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      { name, description, image, categoryId },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "SubCategory updated", updatedSubCategory });
  } catch (error) {
    res.status(500).json({ message: "Error updating subCategory", error });
  }
};

exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await SubCategory.findByIdAndDelete(id);
    res.status(200).json({ message: "SubCategory deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subCategory", error });
  }
};
