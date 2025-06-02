// services/promotionService.js
const Product = require("../models/product");

exports.cleanupExpiredPromotions = async () => {
  const now = new Date();
  const expiredProducts = await Product.find({
    promotionEndDate: { $lte: now },
    salePrice: { $exists: true },
  });

  for (const product of expiredProducts) {
    // Archive the current promotion
    product.promotionHistory.push({
      salePrice: product.salePrice,
      discountPercentage: product.discountPercentage,
      startDate: product.promotionStartDate,
      endDate: product.promotionEndDate,
      approved: product.promotionApproved,
      rejectionNote: product.promotionRejectionNote,
    });

    // Clear active promotion fields
    product.salePrice = undefined;
    product.discountPercentage = undefined;
    product.promotionStartDate = undefined;
    product.promotionEndDate = undefined;
    product.promotionApproved = false;
    product.promotionRejectionNote = undefined;

    await product.save();
  }
};
