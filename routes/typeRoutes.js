const express = require("express");
const upload = require("../middlewares/multerSetup");
const {
  createType,
  getTypes,
  updateType,
  deleteType,
  getTypeById,
  getTypesForSubCategory,
  getTypesNoConditions,
} = require("../controllers/typeController");

const router = express.Router();

router.post("/create", upload.single("image"), createType);
router.get("/", getTypes);
router.get("/getAll", getTypesNoConditions);
router.get("/subcategories/:subCategoryId/types", getTypesForSubCategory);
router.get("/types/:id", getTypeById);
router.put("/:id", upload.single("image"), updateType);
router.delete("/:id", deleteType);

module.exports = router;
