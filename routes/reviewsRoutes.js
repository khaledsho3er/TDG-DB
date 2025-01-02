const express = require("express");
const router = express.Router();
const {
  createReview,
  getReviews,
  deleteReview,
} = require("../controllers/ReviewsController");

// Create a review
router.post("/createreviews", createReview);

// Get reviews
router.get("/getreviews", getReviews);

// Delete a review
router.delete("/reviews/:reviewId", deleteReview);

module.exports = router;
