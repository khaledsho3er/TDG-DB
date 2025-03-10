const mongoose = require("mongoose");

const productTagSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  tagId: { type: mongoose.Schema.Types.ObjectId, ref: "Tag", required: true },
});

module.exports = mongoose.model("ProductTag", productTagSchema);
