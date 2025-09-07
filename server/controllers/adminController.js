const User = require("../models/User");
const Venue = require("../models/Venue");
const Event = require("../models/Event");

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    // Get comprehensive stats in parallel
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      eventManagerUsers,
      attendeeUsers,
      totalVenues,
      pendingVenues,
      approvedVenues,
      rejectedVenues,
      totalEvents,
      upcomingEvents,
      pastEvents,
      activeEvents,
      recentUsers,
      recentVenues,
      recentEvents,
    ] = await Promise.all([
      // User counts
      User.countDocuments(),
      User.countDocuments({ status: "active" }),
      User.countDocuments({ status: "suspended" }),
      User.countDocuments({ type: "admin" }),
      User.countDocuments({ type: "event_manager" }),
      User.countDocuments({ type: "user" }),

      // Venue counts
      Venue.countDocuments(),
      Venue.countDocuments({ approvalStatus: "pending" }),
      Venue.countDocuments({ approvalStatus: "approved" }),
      Venue.countDocuments({ approvalStatus: "rejected" }),

      // Event counts
      Event.countDocuments(),
      Event.countDocuments({
        "dateTime.startDate": { $gte: new Date() },
        status: { $nin: ["cancelled", "postponed"] },
      }),
      Event.countDocuments({
        "dateTime.endDate": { $lt: new Date() },
        status: { $nin: ["cancelled", "postponed"] },
      }),
      Event.countDocuments({
        "dateTime.startDate": { $lte: new Date() },
        "dateTime.endDate": { $gte: new Date() },
        status: { $nin: ["cancelled", "postponed"] },
      }),

      // Recent activity (last 30 days)
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Venue.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Event.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    // Calculate venue approval rate
    const totalVenuesSubmitted = totalVenues;
    const approvalRate =
      totalVenuesSubmitted > 0
        ? ((approvedVenues / totalVenuesSubmitted) * 100).toFixed(1)
        : 0;

    res.status(200).json({
      success: true,
      message: "Dashboard stats retrieved successfully",
      data: {
        // Basic counts
        totalUsers,
        totalVenues,
        totalEvents,

        // User breakdown
        userBreakdown: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          admins: adminUsers,
          eventManagers: eventManagerUsers,
          attendees: attendeeUsers,
        },

        // Venue breakdown
        venueBreakdown: {
          total: totalVenues,
          pending: pendingVenues,
          approved: approvedVenues,
          rejected: rejectedVenues,
          approvalRate: parseFloat(approvalRate),
        },

        // Event breakdown
        eventBreakdown: {
          total: totalEvents,
          upcoming: upcomingEvents,
          past: pastEvents,
          active: activeEvents,
        },

        // Recent activity (last 30 days)
        recentActivity: {
          newUsers: recentUsers,
          newVenues: recentVenues,
          newEvents: recentEvents,
        },

        // Legacy format for existing frontend
        pendingVenues,
        approvedVenues,
        rejectedVenues,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { page = 1, limit = 50, type, status, search } = req.query;

    const query = {};

    // Build filters
    if (type && type !== "all") query.type = type;
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { "profile.phone": new RegExp(search, "i") },
      ];
    }

    const users = await User.find(query)
      .select("-password -emailVerificationToken -resetPasswordToken")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get user details by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserDetails = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const user = await User.findById(req.params.id)
      .select("-password -emailVerificationToken -resetPasswordToken")
      .populate("eventsAttended", "title startDate")
      .populate("eventsCreated", "title startDate");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User details retrieved successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Get user details error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'active' or 'suspended'",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent admin from suspending themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own status",
      });
    }

    // Prevent suspending other admins
    if (user.type === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot suspend other administrators",
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${status} successfully`,
      data: {
        user: user.toObject({
          transform: (doc, ret) => {
            delete ret.password;
            delete ret.emailVerificationToken;
            delete ret.resetPasswordToken;
            return ret;
          },
        }),
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all venues with filters for admin
// @route   GET /api/admin/venues
// @access  Private (Admin only)
const getAllVenues = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const { page = 1, limit = 50, status, search, venueType } = req.query;

    const query = {};

    // Build filters
    if (status && status !== "all") query.approvalStatus = status;
    if (venueType && venueType !== "all") query.venueType = venueType;
    if (search) {
      query.$or = [
        { name: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { "address.city": new RegExp(search, "i") },
        { "address.state": new RegExp(search, "i") },
      ];
    }

    const venues = await Venue.find(query)
      .populate("owner", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })
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
    console.error("Get all venues for admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all events for admin with filters
// @route   GET /api/admin/events
// @access  Private (Admin only)
const getAllEvents = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    const {
      status,
      category,
      city,
      state,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    if (city) {
      query["venue.city"] = { $regex: city, $options: "i" };
    }

    if (state) {
      query["venue.state"] = { $regex: state, $options: "i" };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { "organizer.name": { $regex: search, $options: "i" } },
        { "venue.name": { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query["dateTime.startDate"] = {};
      if (startDate) {
        query["dateTime.startDate"].$gte = new Date(startDate);
      }
      if (endDate) {
        query["dateTime.startDate"].$lte = new Date(endDate);
      }
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with aggregation for better filtering
    const pipeline = [
      {
        $lookup: {
          from: "venues",
          localField: "venue",
          foreignField: "_id",
          as: "venueDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizerDetails",
        },
      },
      {
        $unwind: {
          path: "$venueDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$organizerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "venue.name": "$venueDetails.name",
          "venue.city": "$venueDetails.city",
          "venue.state": "$venueDetails.state",
          "venue.address": "$venueDetails.address",
          "organizer.name": "$organizerDetails.name",
          "organizer.email": "$organizerDetails.email",
          attendeesCount: { $size: { $ifNull: ["$attendees", []] } },
          totalCapacity: "$pricing.totalCapacity",
        },
      },
      {
        $match: query,
      },
      {
        $project: {
          title: 1,
          description: 1,
          category: 1,
          dateTime: 1,
          status: 1,
          isActive: 1,
          pricing: 1,
          attendeesCount: 1,
          totalCapacity: 1,
          createdAt: 1,
          updatedAt: 1,
          "venue.name": 1,
          "venue.city": 1,
          "venue.state": 1,
          "venue.address": 1,
          "organizer.name": 1,
          "organizer.email": 1,
          "organizerDetails.type": 1,
        },
      },
      {
        $sort: sortOptions,
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit),
      },
    ];

    const events = await Event.aggregate(pipeline);

    // Get total count
    const countPipeline = [
      {
        $lookup: {
          from: "venues",
          localField: "venue",
          foreignField: "_id",
          as: "venueDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizerDetails",
        },
      },
      {
        $unwind: {
          path: "$venueDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$organizerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "venue.name": "$venueDetails.name",
          "venue.city": "$venueDetails.city",
          "venue.state": "$venueDetails.state",
          "organizer.name": "$organizerDetails.name",
          "organizer.email": "$organizerDetails.email",
        },
      },
      {
        $match: query,
      },
      {
        $count: "total",
      },
    ];

    const countResult = await Event.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    res.status(200).json({
      success: true,
      message: "Events retrieved successfully",
      data: {
        events,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEvents: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        filters: {
          status,
          category,
          city,
          state,
          search,
          startDate,
          endDate,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error("Get all events for admin error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getAllVenues,
  getAllEvents,
};
