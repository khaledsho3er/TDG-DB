const express = require("express");
const router = express.Router();
const { getVendorSales } = require("../controllers/salesController");

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

module.exports = router;
