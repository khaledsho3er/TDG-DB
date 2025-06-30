const Product = require("../models/Products");
const Notification = require("../models/notification");
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

// Create a promotion for a specific product
exports.createProductPromotion = async (req, res) => {
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

    // Create the promotion by updating the product
    product.salePrice = salePrice;
    product.discountPercentage = discountPercentage.toFixed(2);
    product.promotionStartDate = startDate;
    product.promotionEndDate = endDate;

    await product.save();
    // Create admin notification for pending promotion
    const adminNotification = new Notification({
      type: "Product Promotion",
      description: `Promotion for product '${product.name}' from '${product.price}'to '${product.salePrice}'by '${product.discountPercentage}'% OFF `,
      read: false,
    });
    await adminNotification.save();

    res.json({ message: "Promotion created successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Update an existing promotion for a specific product
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

    // Update the promotion details
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

// Update promotion approval status
exports.updatePromotionApproval = async (req, res) => {
  try {
    const { id } = req.params; // Get product ID from URL
    const { promotionApproved, promotionRejectionNote } = req.body;

    // Find the product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update promotion approval status
    product.promotionApproved = promotionApproved;

    // If rejecting the promotion, add rejection note
    if (promotionApproved === false && promotionRejectionNote) {
      product.promotionRejectionNote = promotionRejectionNote;
    } else if (promotionApproved === true) {
      // Clear rejection note if approving
      product.promotionRejectionNote = undefined;
    }

    await product.save();

    // Create notification for the brand
    const notification = new Notification({
      type: "Promotion Status",
      description: `Your promotion for product "${product.name}" has been ${
        promotionApproved ? "approved" : "rejected"
      }${
        !promotionApproved && promotionRejectionNote
          ? `. Reason: ${promotionRejectionNote}`
          : ""
      }`,
      brandId: product.brandId,
    });

    await notification.save();

    res.json({
      message: `Promotion ${
        promotionApproved ? "approved" : "rejected"
      } successfully`,
      product,
    });
  } catch (error) {
    console.error("Error updating promotion approval:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
