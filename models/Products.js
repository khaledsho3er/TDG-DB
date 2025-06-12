const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    price: { type: Number, required: true },
    salePrice: { type: Number }, // Optional field for sale price
    discountPercentage: { type: Number }, // Automatically calculated
    promotionStartDate: { type: Date }, // New field for promotion start
    promotionEndDate: { type: Date }, // New field for promotion end
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }, // ObjectId
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "subcategories" }, // ObjectId
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    type: { type: mongoose.Schema.Types.ObjectId, ref: "types" }, // ObjectId
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
    cadFile: { type: String },
    technicalDimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      weight: { type: Number },
    },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" }, // Reference to vendor ID in User table
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" }, // Reference to Brand model
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
    readyToShip: { type: Boolean, default: false },
    sales: { type: Number, default: 0 },
    status: { type: Boolean, default: false }, // New attribute to indicate if the product is approved or not
    rejectionNote: { type: String }, // Optional note when product is rejected
    promotionApproved: { type: Boolean, default: false }, // New attribute to indicate if the promotion is approved or not
    promotionRejectionNote: { type: String }, // Optional note when promotion is rejected
    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant", // Reference to the ProductVariant schema
      },
    ], // Array of product variants
  },
  { timestamps: true }
);
productSchema.index({ promotionEndDate: 1 });

// Pre-save hook to calculate discount percentage
productSchema.pre("save", function (next) {
  if (this.salePrice && this.salePrice < this.price) {
    this.discountPercentage = Math.round(
      ((this.price - this.salePrice) / this.price) * 100
    );
  } else {
    this.discountPercentage = undefined;
  }
  next();
});
module.exports = mongoose.model("Product", productSchema);
