const cron = require("node-cron");
const Product = require("../models/Products");

const expirePromotions = async () => {
  try {
    const now = new Date();

    // Find expired promotions
    const expiredPromotions = await Product.find({
      promotionEndDate: { $lt: now },
      salePrice: { $ne: null }, // Only update if salePrice is still set
    });

    for (let product of expiredPromotions) {
      product.salePrice = null;
      product.discountPercentage = null;
      product.promotionApproved = false; // Optional: reset approval
      await product.save();
    }

    console.log(`${expiredPromotions.length} promotions expired.`);
  } catch (error) {
    console.error("Error expiring promotions:", error);
  }
};

module.exports = expirePromotions;
