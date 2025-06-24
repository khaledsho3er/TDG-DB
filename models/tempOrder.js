const mongoose = require("mongoose");

const tempOrderSchema = new mongoose.Schema({
  paymobOrderId: { type: Number, required: true, unique: true },
  transformedOrderData: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 }, // auto-delete after 1 hour
});

const TempOrder = mongoose.model("TempOrder", tempOrderSchema);
module.exports = TempOrder;
