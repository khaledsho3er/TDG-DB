const express = require("express");
const router = express.Router();

const {
  createVariant,
  getVariantsBySku,
  updateVariant,
  deleteVariant,
} = require("../controllers/productVariantController.js");

// POST /api/product-variants
router.post("/", createVariant);

// GET /api/product-variants/:sku
router.get("/:sku", getVariantsBySku);

// Optional: PUT /api/product-variants/:id
router.put("/:id", updateVariant);

// Optional: DELETE /api/product-variants/:id
router.delete("/:id", deleteVariant);

module.exports = router;
