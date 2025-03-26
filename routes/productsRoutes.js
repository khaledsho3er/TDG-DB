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
  getProductsByBrandId,
  getProductsByCategoryName,
  getSearchSuggestions,
  updateProductPromotion,
  getProductsByType,
  getSalesAnalytics,
  getProductAnalytics,
} = require("../controllers/productsController");

const router = express.Router();

router.post(
  "/addproduct",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "cadFile", maxCount: 1 }, // Add CAD file field
  ]),
  createProduct
);
router.get("/getproducts", getProducts);
router.get("/search-suggestions", getSearchSuggestions);
router.get("/products/:categoryName", getProductsByCategoryName);
router.get("/category/:categoryId/:categoryName", getProductsByCategory);
router.get(
  "/subcategory/:subcategoryId/:subcategoryName",
  getProductsBySubcategory
);

router.get("/types/:typeId/:typeName", getProductsByType);

router.get("/getsingle/:id", getProductById);
router.put("/promotion/:id", updateProductPromotion);
router.get("/getproducts/brand/:brandId", getProductsByBrandId);
router.put("/:id", upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);
router.post("/upload", upload.array("images", 10), (req, res) => {
  try {
    const filePaths = req.files.map((file) => file.path); // Get file paths
    res.status(200).json({ message: "Files uploaded successfully", filePaths });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ message: "Error uploading files", error });
  }
});
router.get("/sales", getSalesAnalytics);
router.get("/sales/:productId", getProductAnalytics); // Fetch analytics for one product

module.exports = router;
