const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
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
    refundDate: { type: Date, default: Date.now },
    refundAmount: { type: Number, required: true },
    refundReason: { type: String },
    refundStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },
    // Optionally link to a user who processed the refund
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Refund = mongoose.model("Refund", refundSchema);

module.exports = Refund;
