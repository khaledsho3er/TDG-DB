const ProductTag = require("../models/productTag");

// Assign a tag to a product
exports.assignTagToProduct = async (req, res) => {
  try {
    const { productId, tagId } = req.body;
    const productTag = new ProductTag({ productId, tagId });
    await productTag.save();
    res.status(201).json({ message: "Tag assigned to product", productTag });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all tags for a product
exports.getTagsForProduct = async (req, res) => {
  try {
    const productTags = await ProductTag.find({
      productId: req.params.productId,
    }).populate("tagId");
    res.json(productTags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a tag from a product
exports.removeTagFromProduct = async (req, res) => {
  try {
    await ProductTag.findOneAndDelete({
      productId: req.body.productId,
      tagId: req.body.tagId,
    });
    res.json({ message: "Tag removed from product" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
