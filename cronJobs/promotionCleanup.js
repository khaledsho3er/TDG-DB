const cron = require("node-cron");
const Product = require("../models/Products");

const expirePromotions = async () => {
  console.log("🔄 Expire Promotions Job Running...");

  try {
    const now = new Date();

    const expiredPromotions = await Product.find({
      promotionEndDate: { $lt: now },
      salePrice: { $ne: null },
    });

    console.log(`Found ${expiredPromotions.length} expired promotions`);

    for (let product of expiredPromotions) {
      product.salePrice = null;
      product.discountPercentage = null;
      product.promotionApproved = false;
      await product.save();
    }

    console.log("✅ Promotion expiration complete.");
  } catch (error) {
    console.error("❌ Error expiring promotions:", error);
  }
};

module.exports = expirePromotions;
