const SubCategory = require("../models/subCategory");
const Category = require("../models/category"); // Assuming Category model is used for categories

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

exports.getSubCategoriesForCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Find the category by ID
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Fetch sub-categories using the list of sub-category IDs
    const subCategories = await SubCategory.find({
      _id: { $in: category.subCategories },
    });

    res.status(200).json(subCategories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sub-categories", error });
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

exports.getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(
      req.params.subcategoryId
    ).populate("types"); // Populate types for the subcategory

    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    res.json(subcategory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
