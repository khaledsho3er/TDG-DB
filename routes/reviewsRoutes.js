const express = require("express");
const router = express.Router();
const {
  createReview,
  getReviews,
  deleteReview,
} = require("../controllers/ReviewsController");

// Create a review
router.post("/createreviews/:productId", createReview);

// GET request to fetch reviews for a product (using productId in URL)
router.get("/reviews/:productId", getReviews);

// Delete a review
router.delete("/reviews/:reviewId", deleteReview);

module.exports = router;
