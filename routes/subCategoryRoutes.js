const express = require("express");
const upload = require("../middlewares/multerSetup");
const {
  createSubCategory,
  getSubCategories,
  updateSubCategory,
  deleteSubCategory,
} = require("../controllers/subCategoryController");

const router = express.Router();

router.post("/create", upload.single("image"), createSubCategory);
router.get("/", getSubCategories);
router.put("/:id", upload.single("image"), updateSubCategory);
router.delete("/:id", deleteSubCategory);

module.exports = router;
