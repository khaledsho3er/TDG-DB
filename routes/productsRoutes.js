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
} = require("../controllers/productsController");

const router = express.Router();

router.post("/addproduct", upload.array("images", 5), createProduct); // Limit to 5 images
router.get("/getproducts", getProducts);
router.get("/search-suggestions", getSearchSuggestions);
router.get("/products/:categoryName", getProductsByCategoryName);
router.get("/category/:categoryId/:categoryName", getProductsByCategory);
router.get(
  "/subcategory/:subcategoryId/:subcategoryName",
  getProductsBySubcategory
);

router.get("/getsingle/:id", getProductById);
router.get("/getproducts/brand/:brandId", getProductsByBrandId);
router.put("/:id", upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);
router.post("/upload", upload.array("images", 10), (req, res) => {
  try {
    // Get the relative file paths
    const filePaths = req.files.map((file) => {
      const relativePath = path.relative(
        path.join(__dirname, "../"),
        file.path
      );
      return relativePath;
    });

    // Send the relative file paths back to the frontend
    res.status(200).json({ message: "Files uploaded successfully", filePaths });
  } catch (error) {
    console.error("Error uploading files:", error);
    // Send an error response
    res.status(500).json({ message: "Error uploading files", error });
  }
});
module.exports = router;
