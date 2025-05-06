const Variant = require("../models/productVariant");

// Create variant
exports.createVariant = async (req, res) => {
  try {
    const variant = new ProductVariant(req.body);
    await variant.save();
    res.status(201).json(variant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get variants for a SKU
exports.getVariantsBySku = async (req, res) => {
  try {
    const variants = await ProductVariant.find({ sku: req.params.sku });
    res.status(200).json(variants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
