const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Sub-schema for variant combinations
const variantSchema = new Schema({
  name: { type: String, required: true }, // e.g., "Red Leather Large"
  color: { type: String, required: true },
  material: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true }, // Price for this specific variant
  leadTime: { type: Number, required: true }, // in days
  image: { type: String, required: true }, // URL to the variant-specific image
  sku: { type: String, unique: true },
  stock: { type: Number, default: 0 },
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    weight: { type: Number },
  },
  technicalSpecs: {
    type: Map,
    of: Schema.Types.Mixed,
  },
  status: { type: Boolean, default: true }, // To enable/disable specific variants
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    basePrice: { type: Number, required: true }, // Base price of the product
    salePrice: { type: Number },
    discountPercentage: { type: Number },
    promotionStartDate: { type: Date },
    promotionEndDate: { type: Date },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "subcategories" },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    type: { type: mongoose.Schema.Types.ObjectId, ref: "types" },
    manufacturer: { type: String },
    collection: { type: String },
    manufactureYear: { type: Number },
    tags: [{ type: String }],
    reviews: [
      {
        prodId: { type: String },
        review: { type: String },
      },
    ],
    // Available options for variants
    availableColors: [{ type: String }],
    availableMaterials: [{ type: String }],
    availableSizes: [{ type: String }],
    // Main product images (for non-variant products)
    images: [{ type: String }],
    mainImage: { type: String },
    description: { type: String, maxlength: 2000 },
    cadFile: { type: String },
    // Base technical dimensions (for non-variant products)
    technicalDimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      weight: { type: Number },
    },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },
    baseLeadTime: { type: String }, // Base lead time for non-variant products
    stock: { type: Number, default: 0 }, // Base stock for non-variant products
    sku: { type: String }, // Base SKU
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
    sales: { type: Number, default: 0 },
    status: { type: Boolean, default: false },
    // Variant configuration
    hasVariants: { type: Boolean, default: false },
    variants: [variantSchema],
    defaultVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "variantSchema",
    },
  },
  { timestamps: true }
);

// Pre-save hook to calculate discount percentage
productSchema.pre("save", function (next) {
  if (this.salePrice && this.salePrice < this.basePrice) {
    this.discountPercentage = Math.round(
      ((this.basePrice - this.salePrice) / this.basePrice) * 100
    );
  } else {
    this.discountPercentage = undefined;
  }
  next();
});

// Pre-save hook to generate SKUs for variants
productSchema.pre("save", function (next) {
  if (this.hasVariants && this.variants) {
    this.variants.forEach((variant) => {
      if (!variant.sku) {
        // Generate a unique SKU for each variant combination
        variant.sku = `${this.sku}-${variant.color
          .toLowerCase()
          .replace(/\s+/g, "-")}-${variant.material
          .toLowerCase()
          .replace(/\s+/g, "-")}-${variant.size
          .toLowerCase()
          .replace(/\s+/g, "-")}`;
      }
    });
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
