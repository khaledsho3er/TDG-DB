const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
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
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Sales", saleSchema);
