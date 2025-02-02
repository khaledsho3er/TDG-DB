const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema(
  {
    brandName: { type: String, required: true },
    commercialRegisterNo: { type: String },
    taxNumber: { type: String },
    companyAddress: { type: String },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    bankAccountNumber: { type: String },
    websiteURL: { type: String },
    instagramURL: { type: String },
    facebookURL: { type: String },
    tiktokURL: { type: String },
    linkedinURL: { type: String },
    shippingPolicy: { type: String },
    brandlogo: { type: String }, // Single logo path
    digitalCopiesLogo: { type: [String] }, // Array of logo paths
    coverPhoto: { type: String }, // Single cover photo path
    catalogues: { type: [String] }, // Array of catalogue paths
    brandDescription: { type: String },
    status: {
      type: String,
      enum: ["deactivated", "active", "pending", "rejected"],
      default: "pending",
    },
    documents: { type: [String] }, // Array of tax document paths
    fees: { type: Number },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", BrandSchema);
