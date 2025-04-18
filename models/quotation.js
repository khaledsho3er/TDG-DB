// models/Quotation.js
const mongoose = require("mongoose");

const QuotationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a 'User' model for the users
    required: true,
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand", // Assuming you have a 'Brand' model for the brands
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product", // Assuming you have a 'Product' model for the products
    required: true,
  },
  material: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  customization: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Quotation = mongoose.model("Quotation", QuotationSchema);

module.exports = Quotation;
