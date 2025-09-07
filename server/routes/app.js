const express = require("express");
const router = express.Router();
const { auth, requireProfileCompletion } = require("../middleware/auth");

// @route   GET /api/app/dashboard
// @desc    Get user dashboard (requires completed profile)
// @access  Private + Profile Completed
router.get("/dashboard", auth, requireProfileCompletion, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to your dashboard!",
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        type: req.user.type,
        isProfileCompleted: req.user.isProfileCompleted,
      },
      dashboardData: {
        upcomingEvents: [],
        bookmarkedEvents: [],
        pastEvents: req.user.pastEvents || [],
        preferences: req.user.preferences || {},
      },
    },
  });
});

// @route   GET /api/app/events
// @desc    Get events near user (requires completed profile for location)
// @access  Private + Profile Completed
router.get("/events", auth, requireProfileCompletion, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Events retrieved successfully",
    data: {
      events: [
        // This would contain actual events from the database
        {
          id: "sample-event-1",
          title: "Sample Event",
          location: "Sample Location",
          distance: "2.5 km away",
        },
      ],
      userLocation: req.user.location,
    },
  });
});

// @route   GET /api/app/profile-status
// @desc    Check profile completion status
// @access  Private
router.get("/profile-status", auth, (req, res) => {
  const missingFields = [];

  if (!req.user.name) missingFields.push("name");
  if (!req.user.phone) missingFields.push("phone");
  if (!req.user.dateOfBirth) missingFields.push("dateOfBirth");
  if (!req.user.location || !req.user.location.city)
    missingFields.push("location");
  if (
    !req.user.preferences ||
    !req.user.preferences.categories ||
    req.user.preferences.categories.length === 0
  ) {
    missingFields.push("preferences");
  }

  res.status(200).json({
    success: true,
    data: {
      isProfileCompleted: req.user.isProfileCompleted,
      completionPercentage: Math.round(((5 - missingFields.length) / 5) * 100),
      missingFields,
      requiredFields: [
        "name",
        "phone",
        "dateOfBirth",
        "location",
        "preferences",
      ],
    },
  });
});

module.exports = router;
