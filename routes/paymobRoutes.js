const express = require("express");
const router = express.Router();
const PaymobController = require("../controllers/paymobController");

// Get Paymob configuration
router.get("/config", PaymobController.getConfig);

// Create payment
router.post("/create-payment", PaymobController.createPayment);

// Handle Paymob callback
router.post("/callback", PaymobController.handleCallback);

module.exports = router;
