const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Create the multer instance
const upload = multer({ storage: storage });

const {
  createVariants,
  getVariantsBySku,
  getVariantsByProductId,
  getAllProductSkus,
  updateVariant,
  deleteVariant,
  getProductIdBySku,
} = require("../controllers/productVariantController");

// Get all product SKUs for dropdown
router.get("/skus", getAllProductSkus);

// Get product ID by SKU
router.get("/product-by-sku/:sku", getProductIdBySku);

// Create variants (single or multiple)
router.post(
  "/",
  upload.fields([{ name: "images", maxCount: 10 }]),
  createVariants
);

// Create variants for a specific product
router.post(
  "/product/:productId/variants",
  upload.fields([{ name: "images", maxCount: 10 }]),
  createVariants
);

// Get variants by SKU
router.get("/sku/:sku", getVariantsBySku);

// Get all variants for a product
router.get("/product/:productId", getVariantsByProductId);

// Update a variant
router.put(
  "/:id",
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateVariant
);

// Delete a variant
router.delete("/:id", deleteVariant);

module.exports = router;
