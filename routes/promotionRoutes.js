const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotionController");

// Get current promotions
router.get("/promotions/current", promotionController.getCurrentPromotions);

// Get past promotions
router.get("/promotions/past", promotionController.getPastPromotions);

// Create or update promotion
router.post("/promotions/:id", promotionController.updateProductPromotion);

// End promotion early
router.post("/promotions/end/:id", promotionController.endPromotion);

module.exports = router;
