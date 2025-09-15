const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    isVerifiedAttendee: {
      type: Boolean,
      default: false,
    },
    // Help identify if this review was helpful
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    // Track users who found this review helpful
    helpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Admin moderation
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderationReason: {
      type: String,
    },
    // Response from event organizer
    organizerResponse: {
      comment: String,
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
reviewSchema.index({ event: 1 });
reviewSchema.index({ venue: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ event: 1, user: 1 }, { unique: true }); // One review per user per event
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ venue: 1, rating: -1, createdAt: -1 }); // For venue top reviews

// Virtual for formatted date
reviewSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Ensure virtual fields are included when converting to JSON
reviewSchema.set("toJSON", { virtuals: true });

// Pre-save middleware to verify attendance
reviewSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const Event = mongoose.model("Event");
      const event = await Event.findById(this.event);

      if (!event) {
        throw new Error("Event not found");
      }

      // Check if user attended the event
      const attendeeRecord = event.attendees?.find(
        (attendee) =>
          attendee.user?.toString() === this.user.toString() &&
          attendee.paymentStatus === "completed"
      );
      this.isVerifiedAttendee = !!attendeeRecord;

      // Only allow reviews after event completion
      const now = new Date();
      const eventEndDate = new Date(event.dateTime?.endDate || event.endDate);

      if (eventEndDate > now) {
        throw new Error("Reviews can only be submitted after event completion");
      }

      if (!attendeeRecord) {
        throw new Error("Only event attendees can write reviews");
      }
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Static method to get venue's top reviews (most recent 4)
reviewSchema.statics.getVenueTopReviews = function (venueId, limit = 4) {
  return this.find({
    venue: venueId,
    isModerated: false,
    isVerifiedAttendee: true,
  })
    .populate("user", "name profilePicture")
    .populate("event", "title dateTime")
    .sort({ createdAt: -1, rating: -1, helpfulVotes: -1 }) // Prioritize most recent first
    .limit(limit);
};

// Static method to calculate average rating for a venue
reviewSchema.statics.getVenueAverageRating = function (venueId) {
  return this.aggregate([
    {
      $match: {
        venue: new mongoose.Types.ObjectId(venueId),
        isModerated: false,
        isVerifiedAttendee: true,
      },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingBreakdown: {
          $push: "$rating",
        },
      },
    },
  ]);
};

// Static method to get event reviews
reviewSchema.statics.getEventReviews = function (eventId) {
  return this.find({
    event: eventId,
    isModerated: false,
  })
    .populate("user", "name profilePicture")
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model("Review", reviewSchema);
