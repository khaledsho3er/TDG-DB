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
exports.getBrandSalesInsghits = async (req, res) => {
  try {
    const { brandId } = req.params;

    // Aggregate sales for the brand
    const brandSales = await Sales.aggregate([
      { $match: { brandId: new mongoose.Types.ObjectId(brandId) } },
      {
        $group: {
          _id: "$brandId",
          totalSales: { $sum: "$salesCount" },
          totalRevenue: { $sum: "$revenue" },
        },
      },
    ]);

    res.json(
      brandSales.length ? brandSales[0] : { totalSales: 0, totalRevenue: 0 }
    );
  } catch (error) {
    console.error("Error fetching brand sales:", error);
    res.status(500).json({ error: "Failed to fetch brand sales data" });
  }
};
