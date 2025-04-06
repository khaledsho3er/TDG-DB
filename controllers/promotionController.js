const Product = require("../models/Products");

// Fetch current promotions (active promotions)
// Fetch current promotions for a specific brand
exports.getCurrentPromotions = async (req, res) => {
  try {
    const { brandId } = req.params; // Get brandId from URL or authenticated user
    const today = new Date();

    // Fetch products with active promotions for the specified brand
    const currentPromotions = await Product.find({
      brandId: brandId, // Filter by brandId
      promotionStartDate: { $lte: today },
      promotionEndDate: { $gte: today },
    }).populate("category subcategory vendor type brandId");

    res.json(currentPromotions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Fetch past promotions (promotions that have ended)
// Fetch past promotions for a specific brand
exports.getPastPromotions = async (req, res) => {
  try {
    const { brandId } = req.params; // Get brandId from URL or authenticated user
    const today = new Date();

    // Fetch past promotions for the specified brand
    const pastPromotions = await Product.find({
      brandId: brandId, // Filter by brandId
      promotionEndDate: { $lt: today },
    }).populate("category subcategory vendor type brandId");

    res.json(pastPromotions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Create or update product promotion
// Create or update product promotion for a specific brand
exports.updateProductPromotion = async (req, res) => {
  try {
    const { salePrice, startDate, endDate, brandId } = req.body;
    const { id } = req.params; // Get product ID from URL

    // Ensure the product belongs to the logged-in brand
    const product = await Product.findById(id);
    if (!product || product.brandId.toString() !== brandId) {
      return res
        .status(404)
        .json({ message: "Product not found or does not belong to the brand" });
    }

    // Calculate discount percentage
    const discountPercentage =
      ((product.price - salePrice) / product.price) * 100;

    product.salePrice = salePrice;
    product.discountPercentage = discountPercentage.toFixed(2);
    product.promotionStartDate = startDate;
    product.promotionEndDate = endDate;

    await product.save();
    res.json({ message: "Promotion updated successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// End promotion early
// End promotion early for a specific brand
exports.endPromotion = async (req, res) => {
  try {
    const { id } = req.params; // Get product ID from URL
    const { brandId } = req.body; // Get brandId from request body or authenticated user

    // Ensure the product belongs to the logged-in brand
    const product = await Product.findById(id);
    if (!product || product.brandId.toString() !== brandId) {
      return res
        .status(404)
        .json({ message: "Product not found or does not belong to the brand" });
    }

    // Set the promotion end date to today
    product.promotionEndDate = new Date();
    await product.save();

    res.json({ message: "Promotion ended successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
