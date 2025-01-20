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
  getProductsByCategoryName,
} = require("../controllers/productsController");

const router = express.Router();

router.post("/addproduct", upload.array("images", 5), createProduct); // Limit to 5 images
router.get("/getproducts", getProducts);
router.get("/products/:categoryName", getProductsByCategoryName);
router.get("/category/:categoryId/:categoryName", getProductsByCategory);
router.get(
  "/subcategory/:subcategoryId/:subcategoryName",
  getProductsBySubcategory
);

router.get("/getsingle/:id", getProductById);

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
module.exports = router;
