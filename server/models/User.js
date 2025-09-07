const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["user", "event_manager", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    profilePicture: {
      type: String, // URL to profile image
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
    preferences: {
      categories: [
        {
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
        },
      ],
      radius: {
        type: Number,
        default: 10, // in kilometers
      },
    },
    pastEvents: [
      {
        event: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
        },
        attendedAt: {
          type: Date,
          default: Date.now,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
      },
    ],
    bookmarkedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    socialLinks: {
      instagram: String,
      twitter: String,
      linkedin: String,
      facebook: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    emailVerificationToken: String,
    emailVerificationCode: {
      type: String,
      length: 6,
    },
    emailVerificationCodeExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ type: 1 });
userSchema.index({ "location.coordinates": "2dsphere" });
userSchema.index({ isVerified: 1, isActive: 1 });

module.exports = mongoose.model("User", userSchema);
