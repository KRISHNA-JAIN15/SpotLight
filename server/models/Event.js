const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    shortDescription: {
      type: String,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: [
        "music",
        "sports",
        "tech",
        "food",
        "art",
        "business",
        "education",
        "entertainment",
        "health",
        "other",
      ],
      required: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    dateTime: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      startTime: String,
      endTime: String,
      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },
    },
    pricing: {
      isFree: {
        type: Boolean,
        default: false,
      },
      tickets: [
        {
          type: {
            type: String,
            required: true,
            trim: true, // e.g., 'General', 'VIP', 'Early Bird'
          },
          price: {
            type: Number,
            required: true,
            min: 0,
          },
          currency: {
            type: String,
            default: "INR",
          },
          quantity: {
            total: {
              type: Number,
              required: true,
              min: 1,
            },
            sold: {
              type: Number,
              default: 0,
            },
            available: {
              type: Number,
              required: true,
            },
          },
          description: String,
          saleStartDate: Date,
          saleEndDate: Date,
          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],
      totalCapacity: {
        type: Number,
        required: true,
      },
      soldTickets: {
        type: Number,
        default: 0,
      },
      availableTickets: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled", "postponed"],
      default: "upcoming",
    },
    images: [
      {
        url: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    features: [
      {
        type: String,
        enum: [
          "live_streaming",
          "recording_allowed",
          "food_included",
          "networking",
          "certificates",
          "merchandise",
          "valet_parking",
          "accessibility",
        ],
      },
    ],
    ageRestriction: {
      minAge: {
        type: Number,
        min: 0,
      },
      maxAge: Number,
      description: String,
    },
    attendees: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        ticketType: String,
        quantity: {
          type: Number,
          default: 1,
        },
        bookingDate: {
          type: Date,
          default: Date.now,
        },
        paymentStatus: {
          type: String,
          enum: ["pending", "completed", "failed", "refunded"],
          default: "pending",
        },
        checkInStatus: {
          type: String,
          enum: ["not_checked_in", "checked_in"],
          default: "not_checked_in",
        },
        checkInTime: Date,
      },
    ],
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
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
          maxlength: 500,
        },
        images: [String], // URLs to review images
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isVerified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    socialMedia: {
      hashtags: [String],
      socialLinks: {
        facebook: String,
        instagram: String,
        twitter: String,
        linkedin: String,
      },
    },
    visibility: {
      type: String,
      enum: ["public", "private", "invite_only"],
      default: "public",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    registrationDeadline: Date,
    cancellationPolicy: {
      type: String,
      maxlength: 500,
    },
    termsAndConditions: {
      type: String,
      maxlength: 1000,
    },
    contactInfo: {
      email: String,
      phone: String,
      website: String,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    totalShares: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ "dateTime.startDate": 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ venue: 1 });
eventSchema.index({ "ratings.average": -1 });
eventSchema.index({ isFeatured: -1, "dateTime.startDate": 1 });
eventSchema.index({ visibility: 1, isActive: 1 });
eventSchema.index({ tags: 1 });

// Virtual for checking if event is past
eventSchema.virtual("isPast").get(function () {
  return new Date() > this.dateTime.endDate;
});

// Virtual for checking if event is ongoing
eventSchema.virtual("isOngoing").get(function () {
  const now = new Date();
  return now >= this.dateTime.startDate && now <= this.dateTime.endDate;
});

// Method to update event status based on current date
eventSchema.methods.updateStatus = function () {
  const now = new Date();

  if (this.status === "cancelled" || this.status === "postponed") {
    return this;
  }

  if (now < this.dateTime.startDate) {
    this.status = "upcoming";
  } else if (now >= this.dateTime.startDate && now <= this.dateTime.endDate) {
    this.status = "ongoing";
  } else {
    this.status = "completed";
  }

  return this.save();
};

// Method to calculate average rating
eventSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
  } else {
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.ratings.average = Math.round((sum / this.reviews.length) * 10) / 10;
    this.ratings.count = this.reviews.length;
  }
  return this.save();
};

// Method to update available tickets
eventSchema.methods.updateTicketAvailability = function () {
  this.pricing.soldTickets = this.attendees
    .filter((attendee) => attendee.paymentStatus === "completed")
    .reduce((total, attendee) => total + attendee.quantity, 0);

  this.pricing.availableTickets =
    this.pricing.totalCapacity - this.pricing.soldTickets;

  // Update individual ticket type availability
  this.pricing.tickets.forEach((ticket) => {
    const soldForThisType = this.attendees
      .filter(
        (attendee) =>
          attendee.ticketType === ticket.type &&
          attendee.paymentStatus === "completed"
      )
      .reduce((total, attendee) => total + attendee.quantity, 0);

    ticket.quantity.sold = soldForThisType;
    ticket.quantity.available = ticket.quantity.total - soldForThisType;
  });

  return this.save();
};

module.exports = mongoose.model("Event", eventSchema);
