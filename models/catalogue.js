const mongoose = require("mongoose");

const catalogSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  title: { type: String, required: true },
  year: { type: Number, required: true },
  pdf: { type: String, required: true }, // Cloudflare URL
  image: { type: String, required: true }, // Cloudflare URL (cover image)
  model: { type: String, required: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Catalog", catalogSchema);
