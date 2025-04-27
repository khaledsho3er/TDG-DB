// models/ProductVariant.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Variant Schema
const productVariantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true, // Size like 'Small', 'Medium', 'Large'
    },
    color: {
      type: String,
      required: true, // Color like 'Red', 'Blue', etc.
    },
    price: {
      type: Number,
      required: true, // Price specific to this variant
    },
    quantity: {
      type: Number,
      required: true, // Stock quantity specific to this variant
      default: 0,
    },
    images: [
      {
        type: String, // Array of image paths for this variant
      },
    ],
    sku: {
      type: String,
      required: true,
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
