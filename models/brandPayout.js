const mongoose = require("mongoose");

const brandPayoutSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  totalSales: { type: Number, default: 0 },
  totalCommission: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  brandReceivable: { type: Number, default: 0 },
  payoutStatus: {
    type: String,
    enum: ["Pending", "Paid"],
    default: "Pending",
  },
  paidAt: { type: Date, default: null },
});

module.exports = mongoose.model("BrandPayout", brandPayoutSchema);
