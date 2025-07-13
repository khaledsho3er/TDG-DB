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
  quotationInvoice: { type: String }, // URL or filename
  note: { type: String },
  customizationLeadTime: { type: String },
  quotePrice: { type: Number },
  dateOfQuotePrice: { type: Date },
  ClientApproval: {
    type: Boolean,
    default: false,
  },
  vendorApproval: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentDetails: {
    paid: { type: Boolean, default: false },
    paymentId: { type: String },
    paymentMethod: { type: String, enum: ["cod", "paymob"], default: "cod" },
  },
});

const Quotation = mongoose.model("Quotation", QuotationSchema);

module.exports = Quotation;
