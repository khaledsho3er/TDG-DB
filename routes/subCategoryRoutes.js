const express = require("express");
const upload = require("../middlewares/multerSetup");
const Category = require("../models/category"); // Adjust the path to your actual file structure
const SubCategory = require("../models/subCategory");
const Type = require("../models/types");
const {
  createSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
  getSubcategoryById,
  getSubCategoriesForCategory,
} = require("../controllers/subCategoryController");
const router = express.Router();

router.post("/create", upload.single("image"), createSubCategory);
router.get("/get", getSubCategories);
router.put("/:id", upload.single("image"), updateSubCategory);
router.delete("/:id", deleteSubCategory);
router.get("/:subcategoryId", getSubcategoryById);
router.get(
  "/categories/:categoryId/subcategories",
  getSubCategoriesForCategory
);
// Fetch subcategories by category ID
router.get("/bycategory/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Find the category by its ID
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Use the subCategories array from the category document to find subcategories
    const subCategories = await SubCategory.find({
      _id: { $in: category.subCategories },
    });

    res.status(200).json(subCategories); // Return the list of subcategories
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Fetch types by subcategory ID
router.get("/bySubcategory/:subcategoryId", async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    // Find the subcategory by ID
    const subCategory = await SubCategory.findById(subcategoryId);
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Fetch only the types whose IDs are listed in the 'types' field of the subcategory document
    const types = await Type.find({
      _id: { $in: subCategory.types }, // The 'types' field in subcategory contains an array of type IDs
    });

    if (!types || types.length === 0) {
      return res
        .status(404)
        .json({ message: "No types found for this subcategory" });
    }

    res.status(200).json(types); // Return the filtered list of types
  } catch (error) {
    console.error("Error fetching types:", error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
