const mongoose = require("mongoose");

const SalesSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  salesCount: { type: Number, default: 0 }, // Number of sales
  revenue: { type: Number, default: 0 }, // Total revenue from product
  date: { type: Date, default: Date.now }, // Sales record date
  lastUpdated: { type: Date, default: Date.now }, // Last update timestamp
});

module.exports = mongoose.model("Sales", SalesSchema);
