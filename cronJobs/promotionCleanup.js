const cron = require("node-cron");
const Product = require("../models/Products"); // adjust the path as needed

// Run every day at midnight
const promotionCleanupJob = cron.schedule("0 0 * * *", async () => {
  const now = new Date();

  try {
    const expiredProducts = await Product.find({
      promotionEndDate: { $lt: now },
      salePrice: { $ne: null },
    });

    if (expiredProducts.length === 0) {
      console.log("No expired promotions to clean up.");
      return;
    }

    const updates = expiredProducts.map(async (product) => {
      product.salePrice = null;
      product.discountPercentage = null;
      product.promotionStartDate = null;
      product.promotionEndDate = null;

      await product.save();
    });

    await Promise.all(updates);

    console.log(
      `✅ Expired promotions cleaned for ${expiredProducts.length} products.`
    );
  } catch (err) {
    console.error("❌ Error during promotion cleanup job:", err.message);
  }
});

module.exports = promotionCleanupJob;
