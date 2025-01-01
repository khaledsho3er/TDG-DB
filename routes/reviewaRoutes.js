const express = require("express");
const router = express.Router();
const {
  createReview,
  getReviews,
  deleteReview,
} = require("../controllers/reviewController");
const { authenticate } = require("../middlewares/authenticate"); // Assuming authentication middleware

// Create a review
router.post("/reviews", authenticate, createReview);

// Get reviews
router.get("/reviews", getReviews);

// Delete a review
router.delete("/reviews/:reviewId", authenticate, deleteReview);

module.exports = router;
