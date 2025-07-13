const ProductVariant = require("../models/productVariant");
const Product = require("../models/Products");
const mongoose = require("mongoose");

// Create variants (handles both single and multiple)
exports.createVariants = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Extract productId from request body or params
    const productId = req.body.productId || req.params.productId;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Validate that the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(`Creating variants for product: ${productId}`);

    let variantsToCreate = [];
    let savedVariants = [];

    const { variants } = req.body;

    if (variants && (Array.isArray(variants) || typeof variants === "string")) {
      const parsedVariants = Array.isArray(variants)
        ? variants
        : JSON.parse(variants);

      variantsToCreate = parsedVariants.map((variant) => {
        // Ensure color and size are strings and required
        let color = variant.color ? String(variant.color) : undefined;
        let size = variant.size ? String(variant.size) : "one size";
        return {
          ...variant,
          color,
          size,
          productId,
          stock:
            variant.stock !== undefined ? variant.stock : variant.quantity || 0,
          ...(variant.saleprice && { saleprice: variant.saleprice }),
        };
      });

      // Handle image uploads for multiple variants
      if (
        req.files &&
        req.files.images &&
        Array.isArray(req.files.images) &&
        req.files.images.length > 0
      ) {
        const imageUrls = req.files.images.map(
          (file) => file.filename || file.key
        );
        variantsToCreate = variantsToCreate.map((variant) => {
          if (variant.imageIndices && Array.isArray(variant.imageIndices)) {
            const variantImages = variant.imageIndices
              .filter((index) => index >= 0 && index < imageUrls.length)
              .map((index) => imageUrls[index]);
            return {
              ...variant,
              images: variantImages.length > 0 ? variantImages : [],
              mainImage:
                variant.mainImage ||
                (variantImages.length > 0 ? variantImages[0] : null),
              imageIndices: undefined,
            };
          }
          return variant;
        });
      }

      savedVariants = await ProductVariant.insertMany(variantsToCreate, {
        session,
      });
    } else {
      // Single variant case
      let color = req.body.color ? String(req.body.color) : undefined;
      let size = req.body.size ? String(req.body.size) : "one size";
      const variantData = {
        ...req.body,
        color,
        size,
        productId,
        stock:
          req.body.stock !== undefined
            ? req.body.stock
            : req.body.quantity || 0,
      };

      if (
        variantData.dimensions &&
        typeof variantData.dimensions === "string"
      ) {
        try {
          variantData.dimensions = JSON.parse(variantData.dimensions);
        } catch (e) {
          console.error("Error parsing dimensions:", e);
        }
      }

      if (
        req.files &&
        req.files.images &&
        Array.isArray(req.files.images) &&
        req.files.images.length > 0
      ) {
        const imageUrls = req.files.images.map(
          (file) => file.filename || file.key
        );
        variantData.images = imageUrls;
        variantData.mainImage = variantData.mainImage || imageUrls[0];
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
    }).populate("productId", "name sku"); // Populate productId to get name and sku
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

// Get product ID by SKU
exports.getProductIdBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    if (!sku) {
      return res.status(400).json({ error: "SKU is required" });
    }

    // Find the product with the given SKU
    const product = await Product.findOne(
      { sku: sku },
      "_id name colors sizes"
    );

    if (!product) {
      return res.status(404).json({ error: "No product found with this SKU" });
    }

    res.status(200).json({
      productId: product._id,
      productName: product.name,
      colors: product.colors || [],
      sizes: product.sizes || [],
    });
  } catch (error) {
    console.error("Error finding product by SKU:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update variant
exports.updateVariant = async (req, res) => {
  try {
    const updates = { ...req.body };

    // Reconstruct arrays for colors and sizes
    if (req.body.colors) {
      updates.colors = Array.isArray(req.body.colors)
        ? req.body.colors
        : Object.keys(req.body)
            .filter((key) => key.startsWith("colors["))
            .map((key) => req.body[key]);
    }

    if (req.body.sizes) {
      updates.sizes = Array.isArray(req.body.sizes)
        ? req.body.sizes
        : Object.keys(req.body)
            .filter((key) => key.startsWith("sizes["))
            .map((key) => req.body[key]);
    }

    // Parse dimensions if sent as JSON string
    if (updates.dimensions && typeof updates.dimensions === "string") {
      try {
        updates.dimensions = JSON.parse(updates.dimensions);
      } catch (e) {
        console.error("Error parsing dimensions:", e);
      }
    }

    // Ensure stock is properly set (use quantity as fallback)
    if (updates.quantity !== undefined && updates.stock === undefined) {
      updates.stock = updates.quantity;
    }

    // Handle image uploads
    if (req.files && req.files.images && req.files.images.length > 0) {
      const imageUrls = req.files.images.map(
        (file) => file.filename || file.key
      );
      console.log("Updated variant image URLs:", imageUrls);
      updates.images = imageUrls;
      // Set mainImage to the first image if not explicitly provided
      if (!updates.mainImage && imageUrls.length > 0) {
        updates.mainImage = imageUrls[0];
      }
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

// Get variants by brand ID
exports.getVariantsByBrandId = async (req, res) => {
  try {
    const { brandId } = req.params;
    if (!brandId) {
      return res.status(400).json({ error: "Brand ID is required" });
    }

    // Find all variants, populate productId to access brandId
    const variants = await ProductVariant.find()
      .populate({
        path: "productId",
        select: "brandId name sku",
      })
      .exec();

    // Filter variants where the populated product's brandId matches
    const filteredVariants = variants.filter(
      (variant) =>
        variant.productId &&
        variant.productId.brandId &&
        variant.productId.brandId.toString() === brandId
    );

    res.status(200).json(filteredVariants);
  } catch (error) {
    console.error("Error getting variants by brand ID:", error);
    res.status(500).json({ error: error.message });
  }
};
