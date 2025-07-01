const express = require("express");
const router = express.Router();
const {
  generateAdminFinancialLogsFromOrders,
} = require("../services/finance.service");

// Admin-only endpoint to regenerate all logs
router.post("/recalculate", async (req, res) => {
  try {
    await generateAdminFinancialLogsFromOrders();
    res.json({ message: "Admin financial logs recalculated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to recalculate logs", details: err });
  }
});

module.exports = router;
