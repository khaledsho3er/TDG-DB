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

    // Find related products by matching subcategory, tags, or brandId
    const relatedProducts = await Product.find({
      _id: { $ne: productId }, // Exclude the current product
      $or: [
        { subcategory: product.subcategory }, // Match by subcategory ID
        { tags: { $in: product.tags } }, // Match by at least one tag
        { brandId: product.brandId }, // Match by same brand
      ],
    })
      .limit(10) // Limit results to 10
      .populate("category subcategory vendor type brandId"); // Populate related fields

    res.json(relatedProducts);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
