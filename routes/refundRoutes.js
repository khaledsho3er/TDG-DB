const express = require("express");
const refundController = require("../controllers/refundController");
const router = express.Router();

// Create a new refund
router.post("/", refundController.createRefund);

// Get all refunds (admin/internal)
router.get("/", refundController.getAllRefunds);

// Get a single refund by ID
router.get("/:id", refundController.getRefundById);

// Get refunds by brand ID
router.get("/brand/:brandId", refundController.getRefundsByBrand);

// Update a refund
router.put("/:id", refundController.updateRefund);

// Delete a refund (admin/internal)
router.delete("/:id", refundController.deleteRefund);

module.exports = router;
