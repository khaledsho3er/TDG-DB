const express = require("express");
const router = express.Router();
const Product = require("../models/Products");

router.get("/related/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;

    // Fetch the original product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find related products by matching subcategory OR at least one tag
    const relatedProducts = await Product.find({
      _id: { $ne: productId }, // Exclude the current product
      $or: [
        { "subcategory._id": product.subcategory._id }, // Match by subcategory
        { tags: { $in: product.tags } }, // Match by at least one tag
      ],
    }).limit(10); // Limit results to 10

    res.json(relatedProducts);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
