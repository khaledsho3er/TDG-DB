const mongoose = require("mongoose");

const catalogueSchema = new mongoose.Schema({
  vendorID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: true,
  },
  name: { type: String, required: true },
  year: { type: Number, required: true },
  image: { type: String, required: true }, // Path to image
  pdf: { type: String, required: true }, // Path to PDF
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Catalogue", catalogueSchema);
