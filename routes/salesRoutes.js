const express = require("express");
const router = express.Router();
const Sale = require("../models/sales");
const {
  getVendorSales,
  getBrandSalesInsghits,
} = require("../controllers/salesController");

router.get("/brand/:brandId", getBrandSalesInsghits);
router.get("/:brandId", getVendorSales);
router.get("/sales/:brandId", async (req, res) => {
  const { brandId } = req.params;
  try {
    const salesData = await SalesModel.find({ brandId }); // Query based on brandId
    res.json(salesData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sales analytics" });
  }
});
router.get("/sales/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { timeframe } = req.query; // "7d", "30d", etc.

    let startDate = new Date();
    if (timeframe === "7d") startDate.setDate(startDate.getDate() - 7);
    else if (timeframe === "30d") startDate.setDate(startDate.getDate() - 30);
    else if (timeframe === "6m") startDate.setMonth(startDate.getMonth() - 6);

    const sales = await Sale.find({
      productId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: "Server error fetching sales data" });
  }
});
module.exports = router;
