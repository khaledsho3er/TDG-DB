const express = require("express");
const router = express.Router();
const {
  getCurrentPromotions,
  getPastPromotions,
  updateProductPromotion,
  createProductPromotion,
  endPromotion,
} = require("../controllers/promotionController");

// Route to create a promotion for a specific product
router.post("/create/:id", createProductPromotion);
// Route to get current (active) promotions for a specific brand
router.get("/current/:brandId", getCurrentPromotions);

// Route to get past (ended) promotions for a specific brand
router.get("/past/:brandId", getPastPromotions);

// Route to update or create a promotion for a product (for a specific brand)
router.put("/update/:id", updateProductPromotion);

// Route to end a promotion early for a specific product
router.put("/end/:id", endPromotion);

module.exports = router;
