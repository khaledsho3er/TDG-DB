const Product = require("../models/Products");

// Fetch current promotions (active promotions)
exports.getCurrentPromotions = async (req, res) => {
  try {
    const today = new Date();
    const currentPromotions = await Product.find({
      promotionStartDate: { $lte: today },
      promotionEndDate: { $gte: today },
    }).populate("category subcategory vendor type brandId");

    res.json(currentPromotions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Fetch past promotions (promotions that have ended)
exports.getPastPromotions = async (req, res) => {
  try {
    const today = new Date();
    const pastPromotions = await Product.find({
      promotionEndDate: { $lt: today },
    }).populate("category subcategory vendor type brandId");

    res.json(pastPromotions);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Create or update product promotion
exports.updateProductPromotion = async (req, res) => {
  try {
    const { salePrice, startDate, endDate } = req.body;
    const { id } = req.params; // Get product ID from URL

    if (!salePrice || !startDate || !endDate) {
      return res.status(400).json({
        message:
          "Sale price, start date, and end date are required for a promotion.",
      });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

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
exports.endPromotion = async (req, res) => {
  try {
    const { id } = req.params; // Get product ID from URL
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    // Set the promotion end date to today
    product.promotionEndDate = new Date();
    await product.save();

    res.json({ message: "Promotion ended successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
