// models/ProductVariant.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Variant Schema
const productVariantSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    size: {
      type: String,
    },
    color: {
      type: String,
    },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      weight: { type: Number },
    },
    price: {
      type: Number,
      required: true,
    },
    saleprice: {
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
    mainImage: {
      type: String, // Add this field to store the main image
    },
    sku: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    available: {
      type: Boolean,
      default: true, // Availability flag (default to true)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductVariant", productVariantSchema);
