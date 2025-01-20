const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    price: { type: Number, required: true },
    salePrice: { type: Number }, // Optional field for sale price
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // ObjectId
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "SubCategory" }, // ObjectId
    type: { type: mongoose.Schema.Types.ObjectId, ref: "Type" }, // ObjectId
    manufacturer: { type: String },
    collection: { type: String },
    manufactureYear: { type: Number },
    tags: [{ type: String }], // Array of tags
    reviews: [
      {
        prodId: { type: String },
        review: { type: String },
      },
    ],
    colors: [{ type: String }],
    sizes: [{ type: String }],
    images: [{ type: String }], // Array of image paths
    mainImage: { type: String }, // Highlighted main image
    description: { type: String, maxlength: 2000 },
    technicalDimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      weight: { type: Number },
    },
    brandId: { type: String }, // Brand reference
    brandName: { type: String }, // Name of the brand
    leadTime: { type: String }, // Estimated delivery lead time
    stock: { type: Number, default: 0 }, // Stock quantity
    sku: { type: String }, // Stock Keeping Unit
    warrantyInfo: {
      warrantyYears: { type: Number },
      warrantyCoverage: [{ type: String }],
    },
    materialCareInstructions: { type: String },
    productSpecificRecommendations: { type: String },
    Estimatedtimeleadforcustomization: { type: String },
    Customizationoptions: [{ type: String }],
    Additionaldetails: { type: String },
    Additionalcosts: { type: String },
    claimProcess: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
