const express = require("express");
const upload = require("../middlewares/multerSetup");
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.post("/create", upload.single("image"), createCategory);
router.get("/", getCategories);
router.put("/:id", upload.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

router.get("/test", (req, res) => {
  res.send("Category route is working!");
});
module.exports = router;
