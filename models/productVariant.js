// models/ProductVariant.js
const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema(
  {
    parentProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    color: { type: String },
    material: { type: String },
    size: { type: String },
    price: { type: Number },
    salePrice: { type: Number },
    images: [{ type: String }],
    mainImage: { type: String },
    sku: { type: String, unique: true },
    leadTime: { type: String }, // Optional: could be days/weeks based on the variation
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductVariant", productVariantSchema);
