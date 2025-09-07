const Venue = require("../models/Venue");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const {
  geocodeWithFallback,
  validateCoordinates,
} = require("../utils/geocoding");

// @desc    Create a new venue (Event Manager only)
// @route   POST /api/venues
// @access  Private (Event Manager)
const createVenue = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // Check if user is event manager
    if (req.user.type !== "event_manager") {
      return res.status(403).json({
        success: false,
        message: "Only event managers can create venues",
      });
    }

    const {
      name,
      description,
      address,
      contact,
      capacity,
      venueType,
      amenities,
      images,
    } = req.body;

    // Geocode the address
    let coordinates = null;
    if (address.street || address.city || address.state) {
      try {
        const geoResult = await geocodeWithFallback(
          address.street,
          address.city,
          address.state,
          address.country || "India"
        );

        if (
          geoResult &&
          validateCoordinates(geoResult.latitude, geoResult.longitude)
        ) {
          coordinates = [geoResult.longitude, geoResult.latitude]; // MongoDB format
        }
      } catch (geoError) {
        console.error("Geocoding failed:", geoError);
        // Continue without coordinates
      }
    }

    // Create full address
    const fullAddress = [
      address.street,
      address.city,
      address.state,
      address.country,
      address.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    // Create venue
    const venue = new Venue({
      name,
      description,
      address: {
        ...address,
        fullAddress,
      },
      owner: req.user._id,
      location: coordinates
        ? {
            type: "Point",
            coordinates,
          }
        : undefined,
      contact,
      capacity,
      venueType,
      amenities: amenities || [],
      images: images || [],
      approvalStatus: "pending", // Requires admin approval
      isActive: false, // Will be activated after approval
    });

    await venue.save();

    // Populate owner details
    await venue.populate("owner", "name email");

    res.status(201).json({
      success: true,
      message: "Venue created successfully. Pending admin approval.",
      data: { venue },
    });
  } catch (error) {
    console.error("Create venue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all venues for the logged-in event manager
// @route   GET /api/venues/my-venues
// @access  Private (Event Manager)
const getMyVenues = async (req, res) => {
  try {
    if (req.user.type !== "event_manager") {
      return res.status(403).json({
        success: false,
        message: "Only event managers can access this resource",
      });
    }

    const venues = await Venue.find({ owner: req.user._id })
      .populate("owner", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Venues retrieved successfully",
      data: { venues, count: venues.length },
    });
  } catch (error) {
    console.error("Get my venues error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all venues (public - approved only)
// @route   GET /api/venues
// @access  Public
const getAllVenues = async (req, res) => {
  try {
    const {
      city,
      state,
      venueType,
      capacity,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const query = {
      approvalStatus: "approved",
      isActive: true,
    };

    // Build filters
    if (city) query["address.city"] = new RegExp(city, "i");
    if (state) query["address.state"] = new RegExp(state, "i");
    if (venueType) query.venueType = venueType;
    if (capacity) query.capacity = { $gte: parseInt(capacity) };
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { "address.city": new RegExp(search, "i") },
      ];
    }

    const venues = await Venue.find(query)
      .populate("owner", "name email")
      .sort({ "ratings.average": -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Venue.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Venues retrieved successfully",
      data: {
        venues,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalVenues: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all venues error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single venue by ID
// @route   GET /api/venues/:id
// @access  Public
const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id)
      .populate("owner", "name email phone")
      .populate("approvedBy", "name email");

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    // Only show approved venues to non-owners (except admins)
    if (
      venue.approvalStatus !== "approved" &&
      venue.owner._id.toString() !== req.user?._id?.toString() &&
      req.user?.type !== "admin"
    ) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Venue retrieved successfully",
      data: { venue },
    });
  } catch (error) {
    console.error("Get venue by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update venue (Event Manager - own venues only)
// @route   PUT /api/venues/:id
// @access  Private (Event Manager)
const updateVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    // Check if user owns the venue
    if (venue.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own venues",
      });
    }

    // If venue is approved and significant changes are made, reset to pending
    const significantFields = ["name", "address", "capacity", "venueType"];
    const hasSignificantChanges = significantFields.some((field) => {
      if (field === "address") {
        return (
          req.body.address &&
          (req.body.address.street !== venue.address.street ||
            req.body.address.city !== venue.address.city ||
            req.body.address.state !== venue.address.state)
        );
      }
      return req.body[field] && req.body[field] !== venue[field];
    });

    if (hasSignificantChanges && venue.approvalStatus === "approved") {
      req.body.approvalStatus = "pending";
      req.body.isActive = false;
      req.body.approvedBy = undefined;
      req.body.approvedAt = undefined;
    }

    // Geocode new address if provided
    if (req.body.address) {
      const address = { ...venue.address, ...req.body.address };
      try {
        const geoResult = await geocodeWithFallback(
          address.street,
          address.city,
          address.state,
          address.country || "India"
        );

        if (
          geoResult &&
          validateCoordinates(geoResult.latitude, geoResult.longitude)
        ) {
          req.body.location = {
            type: "Point",
            coordinates: [geoResult.longitude, geoResult.latitude],
          };
        }
      } catch (geoError) {
        console.error("Geocoding failed during update:", geoError);
      }

      // Update full address
      const fullAddress = [
        address.street,
        address.city,
        address.state,
        address.country,
        address.pincode,
      ]
        .filter(Boolean)
        .join(", ");

      req.body.address = { ...address, fullAddress };
    }

    const updatedVenue = await Venue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("owner", "name email");

    res.status(200).json({
      success: true,
      message:
        hasSignificantChanges && venue.approvalStatus === "approved"
          ? "Venue updated successfully. Pending admin re-approval due to significant changes."
          : "Venue updated successfully",
      data: { venue: updatedVenue },
    });
  } catch (error) {
    console.error("Update venue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete venue (Event Manager - own venues only)
// @route   DELETE /api/venues/:id
// @access  Private (Event Manager)
const deleteVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    // Check if user owns the venue
    if (venue.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own venues",
      });
    }

    // Check if venue has any events
    const Event = require("../models/Event");
    const eventCount = await Event.countDocuments({ venue: venue._id });

    if (eventCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete venue with existing events. Please cancel or transfer events first.",
      });
    }

    await Venue.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Venue deleted successfully",
    });
  } catch (error) {
    console.error("Delete venue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get pending venues for admin approval
// @route   GET /api/venues/admin/pending
// @access  Private (Admin only)
const getPendingVenues = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const venues = await Venue.find({ approvalStatus: "pending" })
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Pending venues retrieved successfully",
      data: { venues, count: venues.length },
    });
  } catch (error) {
    console.error("Get pending venues error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Approve or reject venue
// @route   PUT /api/venues/:id/approval
// @access  Private (Admin only)
const updateVenueApproval = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { approvalStatus, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid approval status. Must be 'approved' or 'rejected'",
      });
    }

    if (approvalStatus === "rejected" && !rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting a venue",
      });
    }

    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    // Update venue approval status
    venue.approvalStatus = approvalStatus;
    venue.approvedBy = req.user._id;
    venue.approvedAt = new Date();
    venue.isActive = approvalStatus === "approved";

    if (approvalStatus === "rejected") {
      venue.rejectionReason = rejectionReason;
    } else {
      venue.rejectionReason = undefined;
    }

    await venue.save();
    await venue.populate("owner", "name email");
    await venue.populate("approvedBy", "name email");

    res.status(200).json({
      success: true,
      message: `Venue ${approvalStatus} successfully`,
      data: { venue },
    });
  } catch (error) {
    console.error("Update venue approval error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  createVenue,
  getMyVenues,
  getAllVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
  getPendingVenues,
  updateVenueApproval,
};
