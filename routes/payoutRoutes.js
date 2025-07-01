const express = require("express");
const router = express.Router();
const payoutController = require("../controllers/payoutController");

// POST /api/payouts/calculate
router.post("/calculate", payoutController.calculateBrandPayouts);

module.exports = router;
