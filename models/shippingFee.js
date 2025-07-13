const mongoose = require("mongoose");

const shippingFeeSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
    },
    fee: {
      type: Number,
      required: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingFee", shippingFeeSchema);
