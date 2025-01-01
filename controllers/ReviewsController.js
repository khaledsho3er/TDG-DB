const Review = require("../models/Review");
const Product = require("../models/Product");

exports.createReview = async (req, res) => {
  try {
    const { reviewerName, userId, rating, comment, productId } = req.body;

    // Ensure all required fields are present
    if (!reviewerName || !userId || !rating || !comment || !productId) {
      return res
        .status(400)
        .json({
          message:
            "Reviewer name, user ID, rating, comment, and product ID are required",
        });
    }

    // Check if the product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create the review
    const review = new Review({
      reviewerName,
      userId,
      rating,
      comment,
      productId,
    });

    await review.save();
    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { productId, userId } = req.query;

    const filter = {};
    if (productId) filter.productId = productId;
    if (userId) filter.userId = userId;

    const reviews = await Review.find(filter).populate(
      "userId productId",
      "name email"
    ); // Populate user and product details
    res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the logged-in user is the owner of the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this review" });
    }

    await review.deleteOne();
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
