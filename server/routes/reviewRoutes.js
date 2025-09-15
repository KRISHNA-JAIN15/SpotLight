const express = require("express");
const router = express.Router();
const {
  createReview,
  getEventReviews,
  getVenueTopReviews,
} = require("../controllers/reviewController");
const { auth } = require("../middleware/auth");

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private (requires authentication)
router.post("/", auth, createReview);

// @route   GET /api/reviews/event/:eventId
// @desc    Get all reviews for a specific event
// @access  Public
router.get("/event/:eventId", getEventReviews);

// @route   GET /api/reviews/venue/:venueId/top
// @desc    Get top 3 reviews for a venue
// @access  Public
router.get("/venue/:venueId/top", getVenueTopReviews);

module.exports = router;
