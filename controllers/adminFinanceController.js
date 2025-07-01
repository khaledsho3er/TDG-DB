const AdminFinancialLog = require("../models/AdminFinancialLog");

exports.getAdminFinancialLogs = async (req, res) => {
  try {
    const { year, month, brandId } = req.query;

    const query = {};
    if (year) query.year = +year;
    if (month) query.month = +month;
    if (brandId) query.brandId = brandId;

    const logs = await AdminFinancialLog.find(query)
      .populate("orderId", "customerId createdAt")
      .populate("brandId", "brandName");

    res.status(200).json(logs);
  } catch (err) {
    console.error("Error fetching financial logs:", err);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};
