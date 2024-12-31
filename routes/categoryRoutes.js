// const express = require("express");
// const upload = require("../middlewares/multerSetup");
// const {
//   createCategory,
//   getCategories,
//   updateCategory,
//   deleteCategory,
// } = require("../controllers/categoryController");

// const router = express.Router();

// router.post("/create", upload.single("image"), createCategory);
// router.get("/", getCategories);
// router.put("/:id", upload.single("image"), updateCategory);
// router.delete("/:id", deleteCategory);

// router.get("/test", (req, res) => {
//   res.send("Category route is working!");
// });
// module.exports = router;
const express = require("express");
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const upload = require("../middlewares/multerSetup");

router.post("/categories", upload.single("image"), createCategory);
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

module.exports = router;
