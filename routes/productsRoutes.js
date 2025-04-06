const express = require("express");
const upload = require("../middlewares/multerSetup");
const Product = require("../models/Products");
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
router.get("/products/readytoship", async (req, res) => {
  try {
    console.log("Fetching ready-to-ship products...");
    const products = await Product.find({ readyToShip: true, status: true }); // You can also filter approved products only
    if (!products.length) {
      console.log("No products found.");
      return res
        .status(404)
        .json({ message: "No ready-to-ship products found" });
    }
    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching ready-to-ship products:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
