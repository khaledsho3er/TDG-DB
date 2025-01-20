const express = require("express");
const upload = require("../middlewares/multerSetup");
const {
  createProduct,
  getProducts,
  getProductsByCategory,
  getProductsBySubcategory,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productsController");

const router = express.Router();

router.post("/addproduct", upload.array("images", 5), createProduct); // Limit to 5 images
router.get("/getproducts", getProducts);
router.get(
  "/category/:categoryId/:categoryName/products",
  getProductsByCategory
);
router.get(
  "/subcategory/:subcategoryId/:subcategoryName",
  getProductsBySubcategory
);

router.get("/getsingle/:id", getProductById);
router.put("/:id", upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
