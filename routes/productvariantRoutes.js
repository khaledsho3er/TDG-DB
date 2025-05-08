const express = require("express");
const router = express.Router();

const {
  createVariant,
  createMultipleVariants,
  getVariantsBySku,
  getVariantsByProductId,
  getAllProductSkus,
  updateVariant,
  deleteVariant,
} = require("../controllers/productVariantController.js");

// POST /api/product-variants
router.post("/", createVariant);

// POST /api/product-variants/multiple
router.post("/multiple", createMultipleVariants);

// GET /api/product-variants/skus
router.get("/skus", getAllProductSkus);

// GET /api/product-variants/product/:productId
router.get("/product/:productId", getVariantsByProductId);

// GET /api/product-variants/:sku
router.get("/:sku", getVariantsBySku);

// PUT /api/product-variants/:id
router.put("/:id", updateVariant);

// DELETE /api/product-variants/:id
router.delete("/:id", deleteVariant);

module.exports = router;
