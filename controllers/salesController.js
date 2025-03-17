const Sales = require("../models/sales");

// Get sales data for a vendor
exports.getVendorSales = async (req, res) => {
  try {
    const { brandId } = req.params;
    const salesData = await Sales.find({ brandId }).populate(
      "productId",
      "name"
    );
    res.status(200).json(salesData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getbrandSales = async (req, res) => {
  try {
    const { brandId } = req.params;
    const salesData = await Sales.find({ brandId }).populate(
      "productId",
      "name"
    );

    res.status(200).json(salesData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
