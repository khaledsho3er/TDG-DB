const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  types: [{ type: mongoose.Schema.Types.ObjectId, ref: "types" }],
});

const SubCategory = mongoose.model("subcategories", subCategorySchema);
module.exports = SubCategory;
