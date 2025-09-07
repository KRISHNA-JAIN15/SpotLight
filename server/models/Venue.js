const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    address: {
      street: String,
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      pincode: String,
      fullAddress: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: "2dsphere",
      },
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
    },
    contact: {
      phone: {
        type: String,
        required: true,
      },
      email: String,
      website: String,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    venueType: {
      type: String,
      enum: [
        "auditorium",
        "stadium",
        "conference_hall",
        "outdoor_space",
        "club",
        "restaurant",
        "theater",
        "arena",
        "park",
        "gallery",
        "other",
      ],
      required: true,
    },
    amenities: [
      {
        type: String,
        enum: [
          "parking",
          "wifi",
          "ac",
          "sound_system",
          "projector",
          "catering",
          "security",
          "accessibility",
          "restrooms",
          "bar",
          "stage",
          "lighting",
        ],
      },
    ],
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
    pastEvents: [
      {
        event: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
        },
        date: Date,
        attendance: Number,
      },
    ],
    totalEvents: {
      type: Number,
      default: 0,
    },
    // Admin approval system
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    rejectionReason: String,
    isActive: {
      type: Boolean,
      default: false, // Only active after approval
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
venueSchema.index({ "location.coordinates": "2dsphere" });
venueSchema.index({ venueType: 1 });
venueSchema.index({ "ratings.average": -1 });
venueSchema.index({ city: 1, state: 1 });

// Method to calculate average rating
venueSchema.methods.calculateAverageRating = function () {
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

module.exports = mongoose.model("Venue", venueSchema);
