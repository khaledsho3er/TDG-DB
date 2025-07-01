const mongoose = require("mongoose");

const AdminFinancialLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    total: { type: Number, required: true }, // order total
    shippingFee: { type: Number, default: 0 }, // optional
    vat: { type: Number, default: 0 },
    commission: { type: Number, required: true },
    paymobFee: { type: Number, required: true },
    brandPayout: { type: Number, required: true },
    netAdminProfit: { type: Number, required: true },

    capturedAmount: { type: Number, default: 0 },
    convertedAmount: { type: Number, default: 0 },

    date: { type: Date, default: Date.now },
    month: { type: Number },
    year: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminFinancialLog", AdminFinancialLogSchema);
