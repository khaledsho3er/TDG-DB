const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    managerName: { type: String, required: true },
    managerNumber: { type: String, required: true },
    brandName: { type: String, required: true },
    commercialRegisterNo: { type: String },
    taxNumber: { type: String },
    companyAddress: { type: String },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    bankAccount: { type: String },
    websiteURL: { type: String },
    instagramURL: { type: String },
    facebookURL: { type: String },
    tiktokURL: { type: String },
    linkedinURL: { type: String },
    shippingPolicy: { type: String },
    digitalCopiesLogo: { type: [String] }, // Array of logo paths
    coverPhoto: { type: String }, // Single cover photo path
    catalogues: { type: [String] }, // Array of catalogue paths
    brandDescription: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", VendorSchema);
