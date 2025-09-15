const Review = require("../models/Review");
const Event = require("../models/Event");
const Venue = require("../models/Venue");
const User = require("../models/User");
const mongoose = require("mongoose");

// Create a new review
const createReview = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!eventId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Event ID, rating, and comment are required",
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user already reviewed this event
    const existingReview = await Review.findOne({
      event: eventId,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this event",
      });
    }

    // Check if event is completed
    const now = new Date();
    const eventEndDate = new Date(event.dateTime?.endDate || event.endDate);

    if (eventEndDate > now) {
      return res.status(400).json({
        success: false,
        message: "Reviews can only be submitted after event completion",
      });
    }

    // Check if user attended the event
    const attendeeRecord = event.attendees?.find(
      (attendee) =>
        attendee.user?.toString() === userId &&
        attendee.paymentStatus === "completed"
    );

    if (!attendeeRecord) {
      return res.status(403).json({
        success: false,
        message: "Only event attendees can write reviews",
      });
    }

    // Create review
    const review = new Review({
      event: eventId,
      venue: event.venue,
      user: userId,
      rating: parseInt(rating),
      comment: comment.trim(),
      isVerifiedAttendee: true,
    });

    await review.save();

    // Update event's average rating and review count
    await updateEventRating(eventId);

    // Populate user and event info for response
    await review.populate("user", "name profilePicture");
    await review.populate("event", "title dateTime");

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: review, // Direct access to review object
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create review",
    });
  }
};

// Get reviews for a specific event
const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const reviews = await Review.find({
      event: eventId,
      isModerated: false,
    })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments({
      event: eventId,
      isModerated: false,
    });

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          isModerated: false,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      reviews: reviews,
      averageRating: ratingStats[0]?.averageRating || 0,
      totalReviews: totalReviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasMore: page < Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching event reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

// Get top reviews for a venue
const getVenueTopReviews = async (req, res) => {
  try {
    const { venueId } = req.params;
    const limit = parseInt(req.query.limit) || 4; // Changed default to 4

    if (!mongoose.Types.ObjectId.isValid(venueId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid venue ID",
      });
    }

    const reviews = await Review.getVenueTopReviews(venueId, limit);

    // Get venue rating stats
    const ratingStats = await Review.getVenueAverageRating(venueId);

    res.json({
      success: true,
      reviews: reviews,
      averageRating: ratingStats[0]?.averageRating || 0,
      totalReviews: ratingStats[0]?.totalReviews || 0,
    });
  } catch (error) {
    console.error("Error fetching venue reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch venue reviews",
    });
  }
};

// Update a review (only by the review author)
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own reviews",
      });
    }

    // Update fields if provided
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
      review.rating = parseInt(rating);
    }

    if (comment !== undefined) {
      review.comment = comment.trim();
    }

    await review.save();

    // Update event's average rating
    await updateEventRating(review.event);

    await review.populate("user", "name profilePicture");
    await review.populate("event", "title dateTime");

    res.json({
      success: true,
      message: "Review updated successfully",
      data: { review },
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

// Delete a review (only by the review author or admin)
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const userType = req.user.type;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check permissions (owner or admin)
    if (review.user.toString() !== userId && userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews",
      });
    }

    const eventId = review.event;
    await Review.findByIdAndDelete(reviewId);

    // Update event's average rating
    await updateEventRating(eventId);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

// Mark review as helpful
const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID",
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user already marked this as helpful
    const alreadyMarked = review.helpfulUsers.includes(userId);

    if (alreadyMarked) {
      // Remove the helpful vote
      review.helpfulUsers = review.helpfulUsers.filter(
        (id) => id.toString() !== userId
      );
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
    } else {
      // Add the helpful vote
      review.helpfulUsers.push(userId);
      review.helpfulVotes += 1;
    }

    await review.save();

    res.json({
      success: true,
      message: alreadyMarked
        ? "Helpful vote removed"
        : "Review marked as helpful",
      data: {
        helpfulVotes: review.helpfulVotes,
        userMarkedHelpful: !alreadyMarked,
      },
    });
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update helpful status",
    });
  }
};

// Helper function to update event's average rating
const updateEventRating = async (eventId) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          isModerated: false,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const { averageRating = 0, reviewCount = 0 } = stats[0] || {};

    await Event.findByIdAndUpdate(eventId, {
      $set: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount: reviewCount,
        // Also update legacy ratings field for backward compatibility
        "ratings.average": Math.round(averageRating * 10) / 10,
        "ratings.count": reviewCount,
      },
    });
  } catch (error) {
    console.error("Error updating event rating:", error);
  }
};

// Check if user can review an event
const canUserReviewEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event is completed
    const now = new Date();
    const eventEndDate = new Date(event.dateTime?.endDate || event.endDate);
    const isEventCompleted = eventEndDate <= now;

    // Check if user attended
    const attendeeRecord = event.attendees?.find(
      (attendee) =>
        attendee.user?.toString() === userId &&
        attendee.paymentStatus === "completed"
    );
    const hasAttended = !!attendeeRecord;

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      event: eventId,
      user: userId,
    });

    res.json({
      success: true,
      data: {
        canReview: isEventCompleted && hasAttended && !existingReview,
        reasons: {
          eventCompleted: isEventCompleted,
          hasAttended: hasAttended,
          alreadyReviewed: !!existingReview,
        },
        existingReview: existingReview || null,
      },
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check review eligibility",
    });
  }
};

module.exports = {
  createReview,
  getEventReviews,
  getVenueTopReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  canUserReviewEvent,
};
