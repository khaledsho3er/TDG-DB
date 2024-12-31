const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  subCategories: [
    { type: mongoose.Schema.Types.ObjectId, ref: "subcategories" },
  ],
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
