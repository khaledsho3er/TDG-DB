const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multerSetup");

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
