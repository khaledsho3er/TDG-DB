// models/ProductVariant.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Variant Schema
const productVariantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
    },
    color: {
      type: String,
    },
    price: {
      type: Number,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    images: [
      {
        type: String, // Array of image paths for this variant
      },
    ],
    sku: {
      type: String,
      unique: true, // Each variant must have a unique SKU
    },
    available: {
      type: Boolean,
      default: true, // Availability flag (default to true)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductVariant", productVariantSchema);
