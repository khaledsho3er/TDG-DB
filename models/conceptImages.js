const mongoose = require("mongoose");

const conceptImageSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  description: String,
  nodes: [
    {
      x: Number,
      y: Number,
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    },
  ],
  createdByAdmin: { type: Boolean, default: true }, // mark that admin created it
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ConceptImage", conceptImageSchema);
