const Order = require("../models/order");
const BrandPayout = require("../models/brandPayout");

exports.calculateBrandPayouts = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    const from = new Date(fromDate);
    const to = new Date(toDate);

    const orders = await Order.find({
      createdAt: { $gte: from, $lte: to },
      "paymentDetails.paymentStatus": "Paid",
    });

    const brandStats = {};

    orders.forEach((order) => {
      order.cartItems.forEach((item) => {
        const brandId = item.brandId.toString();
        const saleAmount = item.price * item.quantity;
        const commission = item.commissionAmount || 0;
        const tax = item.taxAmount || 0;
        const brandAmount = saleAmount - commission;

        if (!brandStats[brandId]) {
          brandStats[brandId] = {
            brandId,
            totalSales: 0,
            totalCommission: 0,
            totalTax: 0,
            brandReceivable: 0,
          };
        }

        brandStats[brandId].totalSales += saleAmount;
        brandStats[brandId].totalCommission += commission;
        brandStats[brandId].totalTax += tax;
        brandStats[brandId].brandReceivable += brandAmount;
      });
    });

    const summaries = [];

    for (const brandId in brandStats) {
      const summary = brandStats[brandId];

      const existing = await BrandPayout.findOne({
        brandId: summary.brandId,
        fromDate: from,
        toDate: to,
      });

      if (!existing) {
        const created = await BrandPayout.create({
          ...summary,
          fromDate: from,
          toDate: to,
        });
        summaries.push(created);
      } else {
        await BrandPayout.updateOne(
          { _id: existing._id },
          { ...summary, payoutStatus: existing.payoutStatus }
        );
        summaries.push({ ...existing._doc, ...summary });
      }
    }

    return res.status(200).json({
      message: "Brand payouts calculated successfully",
      data: summaries,
    });
  } catch (err) {
    console.error("Error calculating payouts:", err);
    return res
      .status(500)
      .json({ message: "Server Error", error: err.message });
  }
};
