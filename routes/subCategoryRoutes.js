const express = require("express");
const upload = require("../middlewares/multerSetup");
const {
  createSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
  getSubcategoryById,
} = require("../controllers/subCategoryController");

const router = express.Router();

router.post("/create", upload.single("image"), createSubCategory);
router.get("/get", getSubCategories);
router.put("/:id", upload.single("image"), updateSubCategory);
router.delete("/:id", deleteSubCategory);
router.get("/:subcategoryId", getSubcategoryById);

module.exports = router;
