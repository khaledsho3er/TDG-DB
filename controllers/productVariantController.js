const ProductVariant = require("../models/productVariant");
const Product = require("../models/Products");
const mongoose = require("mongoose");

// Create variants (handles both single and multiple)
exports.createVariants = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, variants } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Check if we're creating a single variant or multiple variants
    let variantsToCreate = [];
    let savedVariants = [];

    if (variants && (Array.isArray(variants) || typeof variants === "string")) {
      // Multiple variants case
      // Parse variants if it's a string (from form data)
      const parsedVariants = Array.isArray(variants)
        ? variants
        : JSON.parse(variants);

      variantsToCreate = parsedVariants.map((variant) => ({
        ...variant,
        productId, // Add productId to each variant
      }));

      // Handle image uploads for multiple variants
      if (req.files && req.files.images && req.files.images.length > 0) {
        // In this case, we assume each variant has an 'imageIndices' property
        // that specifies which images belong to it (e.g., [0, 1, 2])
        const imageUrls = req.files.images.map(
          (file) => file.filename || file.key
        );

        variantsToCreate = variantsToCreate.map((variant) => {
          if (variant.imageIndices && Array.isArray(variant.imageIndices)) {
            const variantImages = variant.imageIndices
              .map((index) => imageUrls[index])
              .filter(Boolean);
            return {
              ...variant,
              images: variantImages,
              imageIndices: undefined, // Remove helper property
            };
          }
          return variant;
        });
      }

      // Create all variants
      savedVariants = await ProductVariant.insertMany(variantsToCreate, {
        session,
      });
    } else {
      // Single variant case
      const variantData = {
        ...req.body,
        productId, // Ensure productId is included
      };

      // Handle image uploads for single variant
      if (req.files && req.files.images && req.files.images.length > 0) {
        const imageUrls = req.files.images.map(
          (file) => file.filename || file.key
        );
        console.log("Uploaded variant image URLs:", imageUrls);
        variantData.images = imageUrls;
      } else {
        console.log("No variant images uploaded");
      }

      const variant = new ProductVariant(variantData);
      const savedVariant = await variant.save({ session });
      savedVariants = [savedVariant];
    }

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

    res.status(201).json({
      message: "Variants created successfully",
      variants: savedVariants,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating variants:", error);
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
    const updates = { ...req.body };

    // Handle image uploads
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageUrls = req.files.images.map(
        (file) => file.filename || file.key
      );
      console.log("Updated variant image URLs:", imageUrls);
      updates.images = imageUrls;
    }

    const updatedVariant = await ProductVariant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedVariant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    res.status(200).json({
      message: "Variant updated successfully",
      variant: updatedVariant,
    });
  } catch (error) {
    console.error("Error updating variant:", error);
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
    console.error("Error deleting variant:", error);
    res.status(500).json({ error: error.message });
  }
};
