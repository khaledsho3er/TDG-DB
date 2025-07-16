const Order = require("../models/order");
const AdminFinancialLog = require("../models/AdminFinancialLog");

async function generateAdminFinancialLogsFromOrders() {
  const orders = await Order.find({ "paymentDetails.paymentStatus": "Paid" });

  for (const order of orders) {
    const {
      cartItems,
      _id: orderId,
      total,
      shippingFee = 0,
      vat = 0,
      createdAt,
    } = order;

    for (const item of cartItems) {
      const commission =
        item.commissionAmount ?? +(item.totalPrice * 0.15).toFixed(2);
      const brandId = item.brandId;
      const paymobFee = +(total * 0.03).toFixed(2);
      const brandPayout = +(total - vat - commission - shippingFee).toFixed(2);
      const netAdminProfit = +(commission - paymobFee).toFixed(2);

      await AdminFinancialLog.findOneAndUpdate(
        { orderId, brandId },
        {
          orderId,
          brandId,
          total,
          shippingFee,
          vat,
          commission,
          paymobFee,
          brandPayout,
          netAdminProfit,
          capturedAmount: order.capturedAmount || 0,
          convertedAmount: order.convertedAmount || 0,
          date: createdAt,
          month: new Date(createdAt).getMonth() + 1,
          year: new Date(createdAt).getFullYear(),
        },
        { upsert: true }
      );
    }
  }

  console.log("✅ Admin financial logs generated.");
}

module.exports = {
  generateAdminFinancialLogsFromOrders,
};
