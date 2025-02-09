// models/PurchaseCode.js
const mongoose = require("mongoose");

const viewInStoreSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  status: { type: String, default: "Pending" }, // e.g., Pending, Completed
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("viewInStore", viewInStoreSchema);
