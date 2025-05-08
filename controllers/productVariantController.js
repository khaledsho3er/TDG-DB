const ProductVariant = require("../models/productVariant");
const Product = require("../models/Products");
const mongoose = require("mongoose");

// Create variant
exports.createVariant = async (req, res) => {
  try {
    const variant = new ProductVariant(req.body);
    const savedVariant = await variant.save();

    // Add variant reference to the product
    await Product.findByIdAndUpdate(req.body.productId, {
      $push: { variants: savedVariant._id },
    });

    res.status(201).json(savedVariant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create multiple variants at once
exports.createMultipleVariants = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, variants } = req.body;

    if (!productId || !variants || !Array.isArray(variants)) {
      return res.status(400).json({ error: "Invalid request format" });
    }

    // Add productId to each variant
    const variantsWithProductId = variants.map((variant) => ({
      ...variant,
      productId,
    }));

    // Create all variants
    const savedVariants = await ProductVariant.insertMany(
      variantsWithProductId,
      { session }
    );

    // Get variant IDs
    const variantIds = savedVariants.map((variant) => variant._id);

    // Add variant references to the product
    await Product.findByIdAndUpdate(
      productId,
      { $push: { variants: { $each: variantIds } } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedVariants);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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

// Get all variants for a product
exports.getVariantsByProductId = async (req, res) => {
  try {
    const variants = await ProductVariant.find({
      productId: req.params.productId,
    });
    res.status(200).json(variants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all product SKUs for dropdown
exports.getAllProductSkus = async (req, res) => {
  try {
    const products = await Product.find({}, "name sku");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update variant
exports.updateVariant = async (req, res) => {
  try {
    const updatedVariant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedVariant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    res.status(200).json(updatedVariant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete variant
exports.deleteVariant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const variant = await ProductVariant.findById(req.params.id);

    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    // Remove variant reference from product
    await Product.findByIdAndUpdate(
      variant.productId,
      { $pull: { variants: variant._id } },
      { session }
    );

    // Delete the variant
    await ProductVariant.findByIdAndDelete(req.params.id, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Variant deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};
