const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductVariant",
        },
        name: String,
        quantity: Number,
        price: Number,
        totalPrice: Number,
        selectedColor: String,
        selectedSize: String,
      },
    ],
    totalRefundAmount: { type: Number, required: true },
    reason: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "Refunded", "Not Refunded"],
      default: "Pending",
    },
    brandStatus: {
      type: String,
      enum: ["Pending", "Received", "Not Received"],
      default: "Pending",
    },
    brandReason: { type: String },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    adminNote: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
