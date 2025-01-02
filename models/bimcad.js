const mongoose = require("mongoose");

const bimCadFileSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    file: {
      type: String,
      required: true, // Path or URL to the uploaded file
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

const BimCadFile = mongoose.model("BimCadFile", bimCadFileSchema);
module.exports = BimCadFile;
