const express = require("express");
const router = express.Router();
const PaymobController = require("../controllers/paymobController");

// Get Paymob configuration
router.get("/config", PaymobController.getConfig);

// Create payment
router.post("/create-payment", PaymobController.createPayment);

// Add a test endpoint to verify callbacks
router.post("/test-callback", (req, res) => {
  console.log("=== TEST CALLBACK RECEIVED ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));
  res.status(200).json({ success: true, message: "Test callback received" });
});

// Handle GET requests for the callback URL
router.get("/callback", PaymobController.handleCallbackGet);

// Handle POST requests for the callback URL
// router.post("/callback", PaymobController.handleCallbackPost);

// Simple test route to verify server is accessible
router.get("/test", (req, res) => {
  console.log("Paymob test route accessed");
  res.status(200).json({
    success: true,
    message: "Paymob routes are working",
    serverTime: new Date().toISOString(),
    callbackUrl: `${
      process.env.API_BASE_URL || "https://api.thedesigngrit.com"
    }/api/paymob/callback`,
  });
});
router.post("/refund", PaymobController.refundTransaction);

module.exports = router;
