const Event = require("../models/Event");
const Venue = require("../models/Venue");
const User = require("../models/User");
const TicketService = require("../services/ticketService");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

// @desc    Create a new event (Event Manager only)
// @route   POST /api/events
// @access  Private (Event Manager)
const createEvent = async (req, res) => {
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
        message: "Only event managers can create events",
      });
    }

    const {
      title,
      description,
      shortDescription,
      category,
      subcategory,
      venue,
      dateTime,
      pricing,
      images,
      tags,
      features,
      ageRestriction,
      socialMedia,
      visibility,
      registrationDeadline,
      cancellationPolicy,
      termsAndConditions,
      contactInfo,
    } = req.body;

    // Verify venue exists and is approved
    const venueDoc = await Venue.findById(venue);
    if (!venueDoc) {
      return res.status(404).json({
        success: false,
        message: "Venue not found",
      });
    }

    if (venueDoc.approvalStatus !== "approved" || !venueDoc.isActive) {
      return res.status(400).json({
        success: false,
        message: "Event can only be created at approved venues",
      });
    }

    // Validate dates
    console.log("Received dateTime object:", dateTime);
    console.log("dateTime.startDate:", dateTime.startDate);
    console.log("dateTime.endDate:", dateTime.endDate);

    const startDate = new Date(dateTime.startDate);
    const endDate = new Date(dateTime.endDate);
    const now = new Date();

    console.log("Parsed startDate:", startDate);
    console.log("Parsed startDate ISO:", startDate.toISOString());
    console.log("Current server time:", now);
    console.log("Current server time ISO:", now.toISOString());
    console.log("Start date is before now?", startDate < now);

    // Allow events that start within the next minute to account for timing precision
    const oneMinuteFromNow = new Date(now.getTime() + 60000);

    if (startDate < now) {
      console.log("Rejecting event - start date is in the past");
      return res.status(400).json({
        success: false,
        message: "Event start date must be in the future",
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: "Event end date must be after start date",
      });
    }

    // Calculate available tickets and validate capacity
    let totalCapacity = 0;
    if (pricing && pricing.tickets && pricing.tickets.length > 0) {
      totalCapacity = pricing.tickets.reduce(
        (sum, ticket) => sum + ticket.quantity.total,
        0
      );

      // Set available tickets equal to total initially
      pricing.tickets.forEach((ticket) => {
        ticket.quantity.available = ticket.quantity.total;
        ticket.quantity.sold = 0;
      });
    } else if (pricing && pricing.totalCapacity) {
      totalCapacity = pricing.totalCapacity;
    }

    // Validate against venue capacity
    if (totalCapacity > venueDoc.capacity) {
      return res.status(400).json({
        success: false,
        message: `Event capacity (${totalCapacity}) cannot exceed venue capacity (${venueDoc.capacity})`,
      });
    }

    console.log("Received pricing data:", JSON.stringify(pricing, null, 2));

    // Additional validation for paid events with tickets
    if (!pricing.isFree && pricing.tickets && pricing.tickets.length > 0) {
      const totalTicketQuantity = pricing.tickets.reduce(
        (sum, ticket) => sum + (ticket.quantity.total || 0),
        0
      );

      // Validate ticket quantities don't exceed total capacity
      if (totalTicketQuantity > totalCapacity) {
        return res.status(400).json({
          success: false,
          message: `Total ticket quantity (${totalTicketQuantity}) exceeds maximum event capacity (${totalCapacity})`,
        });
      }

      // Validate individual ticket fields
      for (const ticket of pricing.tickets) {
        if (
          !ticket.type ||
          ticket.price === undefined ||
          !ticket.quantity ||
          !ticket.quantity.total
        ) {
          return res.status(400).json({
            success: false,
            message: "All ticket types must have a name, price, and quantity",
          });
        }

        if (ticket.price < 0) {
          return res.status(400).json({
            success: false,
            message: "Ticket prices cannot be negative",
          });
        }

        if (ticket.quantity.total < 1) {
          return res.status(400).json({
            success: false,
            message: "Ticket quantity must be at least 1",
          });
        }
      }
    }

    // Create event
    const event = new Event({
      title,
      description,
      shortDescription,
      category,
      subcategory,
      organizer: req.user._id,
      venue,
      dateTime: {
        ...dateTime,
        startDate,
        endDate,
      },
      pricing: {
        ...pricing,
        totalCapacity,
        availableTickets: totalCapacity,
        soldTickets: 0,
      },
      images: images || [],
      tags: tags || [],
      features: features || [],
      ageRestriction,
      socialMedia,
      visibility: visibility || "public",
      registrationDeadline,
      cancellationPolicy,
      termsAndConditions,
      contactInfo,
      publishedAt: new Date(),
      status: "upcoming",
      isActive: true,
    });

    await event.save();

    // Populate references
    await event.populate("organizer", "name email");
    await event.populate("venue", "name address contact");

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: { event },
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all events for the logged-in event manager
// @route   GET /api/events/my-events
// @access  Private (Event Manager)
const getMyEvents = async (req, res) => {
  try {
    if (req.user.type !== "event_manager") {
      return res.status(403).json({
        success: false,
        message: "Only event managers can access this resource",
      });
    }

    const { status, page = 1, limit = 10 } = req.query;

    const query = { organizer: req.user._id };
    if (status) query.status = status;

    const events = await Event.find(query)
      .populate("venue", "name address contact")
      .populate("organizer", "name email")
      .sort({ "dateTime.startDate": -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

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
      },
    });
  } catch (error) {
    console.error("Get my events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get all events (public)
// @route   GET /api/events
// @access  Public
const getAllEvents = async (req, res) => {
  try {
    const {
      category,
      city,
      state,
      status = "upcoming",
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      latitude,
      longitude,
      radius, // Remove default value here
    } = req.query;

    // Determine the radius to use
    let finalRadius = 15; // Default fallback

    // If radius is explicitly provided in query, use it
    if (radius) {
      finalRadius = parseFloat(radius);
      console.log(`Using explicit radius from query: ${finalRadius}km`);
    } else {
      // Try to get user's radius preference from profile
      try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        console.log(`Token present: ${token ? "Yes" : "No"}`);
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          console.log(`Token decoded successfully. User ID: ${decoded.userId}`);

          const user = await User.findById(decoded.userId).select(
            "preferences"
          );
          console.log(`User found: ${user ? "Yes" : "No"}`);
          if (user) {
            console.log(`User ID from DB: ${user._id}`);
            console.log(`User preferences:`, user.preferences);
          }
          if (user && user.preferences && user.preferences.radius) {
            finalRadius = user.preferences.radius;
            console.log(`Using user's profile radius: ${finalRadius}km`);
          } else {
            console.log(
              `No radius preference found, using default: ${finalRadius}km`
            );
          }
        } else {
          console.log(`No token found, using default radius: ${finalRadius}km`);
        }
      } catch (authError) {
        // If token is invalid or user not found, use default radius
        // Don't throw error, just continue with default
        console.log("Could not get user radius preference:", authError.message);
      }
    }

    const query = {
      visibility: "public",
      isActive: true,
    };

    // Build filters
    if (category) query.category = category;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
        { tags: new RegExp(search, "i") },
      ];
    }

    if (startDate || endDate) {
      query["dateTime.startDate"] = {};
      if (startDate) query["dateTime.startDate"].$gte = new Date(startDate);
      if (endDate) query["dateTime.startDate"].$lte = new Date(endDate);
    }

    // Build aggregation pipeline for location filtering
    let pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "venues",
          localField: "venue",
          foreignField: "_id",
          as: "venueDetails",
        },
      },
      { $unwind: "$venueDetails" },
    ];

    // Add location-based filtering if coordinates are provided
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      const radiusKm = finalRadius; // Use the determined radius

      console.log(
        `Distance filtering - User: [${userLon}, ${userLat}], Radius: ${radiusKm}km`
      );

      pipeline.push({
        $addFields: {
          distance: {
            $let: {
              vars: {
                lat1: { $degreesToRadians: userLat },
                lon1: { $degreesToRadians: userLon },
                lat2: {
                  $degreesToRadians: {
                    $arrayElemAt: ["$venueDetails.location.coordinates", 1],
                  },
                },
                lon2: {
                  $degreesToRadians: {
                    $arrayElemAt: ["$venueDetails.location.coordinates", 0],
                  },
                },
              },
              in: {
                $multiply: [
                  6371, // Earth's radius in kilometers
                  {
                    $acos: {
                      $add: [
                        {
                          $multiply: [{ $sin: "$$lat1" }, { $sin: "$$lat2" }],
                        },
                        {
                          $multiply: [
                            { $cos: "$$lat1" },
                            { $cos: "$$lat2" },
                            { $cos: { $subtract: ["$$lon2", "$$lon1"] } },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      });

      // Filter events within the specified radius
      pipeline.push({
        $match: {
          distance: { $lte: radiusKm },
        },
      });

      console.log(`Applied distance filter: distance <= ${radiusKm}km`);

      // Sort by distance first, then by date
      pipeline.push({
        $sort: { distance: 1, "dateTime.startDate": 1, isFeatured: -1 },
      });
    } else {
      // Add location filters for city/state if no coordinates
      if (city || state) {
        const locationMatch = {};
        if (city)
          locationMatch["venueDetails.address.city"] = new RegExp(city, "i");
        if (state)
          locationMatch["venueDetails.address.state"] = new RegExp(state, "i");
        pipeline.push({ $match: locationMatch });
      }

      // Default sorting when no location coordinates
      pipeline.push({
        $sort: { "dateTime.startDate": 1, isFeatured: -1 },
      });
    }

    // Add pagination
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: parseInt(limit) });

    // Add organizer details
    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "organizer",
          foreignField: "_id",
          as: "organizerDetails",
        },
      },
      {
        $project: {
          "organizerDetails.password": 0,
          "organizerDetails.emailVerificationToken": 0,
          "organizerDetails.passwordResetToken": 0,
        },
      }
    );

    const events = await Event.aggregate(pipeline);

    console.log(`Final result: Sending ${events.length} events to frontend`);
    events.forEach((event) => {
      console.log(`- Sending: ${event.title}`);
    });

    // Debug logging for distance filtering
    if (latitude && longitude) {
      console.log(`Found ${events.length} events within ${finalRadius}km:`);
      events.forEach((event) => {
        if (event.distance !== undefined) {
          console.log(
            `- ${event.title}: ${event.distance.toFixed(2)}km (${
              event.venueDetails?.name
            })`
          );
        }
      });
    }

    // Get total count for pagination
    let countPipeline = [
      { $match: query },
      {
        $lookup: {
          from: "venues",
          localField: "venue",
          foreignField: "_id",
          as: "venueDetails",
        },
      },
      { $unwind: "$venueDetails" },
    ];

    // Apply same location filtering for count
    if (latitude && longitude) {
      const userLat = parseFloat(latitude);
      const userLon = parseFloat(longitude);
      const radiusKm = finalRadius; // Use the same radius as main pipeline

      countPipeline.push({
        $addFields: {
          distance: {
            $let: {
              vars: {
                lat1: { $degreesToRadians: userLat },
                lon1: { $degreesToRadians: userLon },
                lat2: {
                  $degreesToRadians: {
                    $arrayElemAt: ["$venueDetails.location.coordinates", 1],
                  },
                },
                lon2: {
                  $degreesToRadians: {
                    $arrayElemAt: ["$venueDetails.location.coordinates", 0],
                  },
                },
              },
              in: {
                $multiply: [
                  6371,
                  {
                    $acos: {
                      $add: [
                        {
                          $multiply: [{ $sin: "$$lat1" }, { $sin: "$$lat2" }],
                        },
                        {
                          $multiply: [
                            { $cos: "$$lat1" },
                            { $cos: "$$lat2" },
                            { $cos: { $subtract: ["$$lon2", "$$lon1"] } },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      });

      countPipeline.push({
        $match: {
          distance: { $lte: radiusKm },
        },
      });
    } else if (city || state) {
      const locationMatch = {};
      if (city)
        locationMatch["venueDetails.address.city"] = new RegExp(city, "i");
      if (state)
        locationMatch["venueDetails.address.state"] = new RegExp(state, "i");
      countPipeline.push({ $match: locationMatch });
    }

    countPipeline.push({ $count: "total" });
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
        ...(latitude &&
          longitude && {
            location: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              radius: finalRadius, // Use the actual radius that was applied
            },
          }),
      },
    });
  } catch (error) {
    console.error("Get all events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name email phone bio profilePicture")
      .populate(
        "venue",
        "name description address contact capacity amenities images"
      )
      .populate("reviews.user", "name profilePicture");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Update status if needed
    await event.updateStatus();

    // Increment view count
    event.totalViews += 1;
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event retrieved successfully",
      data: { event },
    });
  } catch (error) {
    console.error("Get event by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update event (Event Manager - own events only)
// @route   PUT /api/events/:id
// @access  Private (Event Manager)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user owns the event
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own events",
      });
    }

    // Prevent updates to completed or ongoing events
    if (["completed", "ongoing"].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update completed or ongoing events",
      });
    }

    // Validate venue if being changed
    if (req.body.venue && req.body.venue !== event.venue.toString()) {
      const venueDoc = await Venue.findById(req.body.venue);
      if (
        !venueDoc ||
        venueDoc.approvalStatus !== "approved" ||
        !venueDoc.isActive
      ) {
        return res.status(400).json({
          success: false,
          message: "Event can only be moved to approved venues",
        });
      }
    }

    // Handle dateTime structure - ensure it exists if dates are provided
    let updateData = { ...req.body };

    // If startDate and endDate are provided at top level, move them to dateTime object
    if (req.body.startDate || req.body.endDate) {
      updateData.dateTime = {
        startDate: req.body.startDate || event.dateTime.startDate,
        endDate: req.body.endDate || event.dateTime.endDate,
      };
      delete updateData.startDate;
      delete updateData.endDate;
    }

    // Validate dates if being changed
    if (updateData.dateTime) {
      console.log("Update - Received dateTime object:", updateData.dateTime);
      console.log(
        "Update - dateTime.startDate:",
        updateData.dateTime.startDate
      );

      const startDate = new Date(updateData.dateTime.startDate);
      const endDate = new Date(updateData.dateTime.endDate);
      const now = new Date();

      console.log("Update - Parsed startDate:", startDate);
      console.log("Update - Parsed startDate ISO:", startDate.toISOString());
      console.log("Update - Current server time:", now);
      console.log("Update - Current server time ISO:", now.toISOString());
      console.log("Update - Start date is before now?", startDate < now);

      if (startDate < now) {
        console.log("Update - Rejecting event - start date is in the past");
        return res.status(400).json({
          success: false,
          message: "Event start date must be in the future",
        });
      }

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: "Event end date must be after start date",
        });
      }
    }

    console.log("Update - Received pricing object:", updateData.pricing);
    console.log("Update - Pricing tickets:", updateData.pricing?.tickets);
    console.log("Update - Full updateData:", updateData);

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("organizer", "name email")
      .populate("venue", "name address contact");

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: { event: updatedEvent },
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Delete event (Event Manager - own events only)
// @route   DELETE /api/events/:id
// @access  Private (Event Manager)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user owns the event
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own events",
      });
    }

    // Prevent deletion if event has attendees
    if (event.attendees.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete event with registered attendees. Please cancel the event instead.",
      });
    }

    // Prevent deletion of ongoing or completed events
    if (["completed", "ongoing"].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete completed or ongoing events",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Cancel event (Event Manager - own events only)
// @route   PUT /api/events/:id/cancel
// @access  Private (Event Manager)
const cancelEvent = async (req, res) => {
  try {
    const { reason } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if user owns the event
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own events",
      });
    }

    // Prevent cancellation of completed events
    if (event.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed events",
      });
    }

    event.status = "cancelled";
    event.cancellationReason = reason;
    event.cancelledAt = new Date();

    await event.save();

    // TODO: Send cancellation notifications to attendees
    // TODO: Process refunds if applicable

    res.status(200).json({
      success: true,
      message: "Event cancelled successfully",
      data: { event },
    });
  } catch (error) {
    console.error("Cancel event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Register for an event
// @route   POST /api/events/:id/register
// @access  Private
const registerForEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { ticketType = "General", quantity = 1 } = req.body;

    console.log("🔍 Registration attempt:", {
      eventId: id,
      userId: req.user.id,
      ticketType,
      quantity,
    });

    // Find the event
    const event = await Event.findById(id).populate("venue");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    console.log("💰 Event pricing info:", {
      isFree: event.pricing.isFree,
      ticketsCount: event.pricing.tickets?.length,
      tickets: event.pricing.tickets?.map((t) => ({
        type: t.type,
        price: t.price,
      })),
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event is active and upcoming
    if (!event.isActive || event.status !== "upcoming") {
      return res.status(400).json({
        success: false,
        message: "Registration is not available for this event",
      });
    }

    // Check if registration deadline has passed
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has passed",
      });
    }

    // Check if user is already registered
    const existingRegistration = event.attendees.find(
      (attendee) => attendee.user.toString() === req.user.id
    );

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    // Check if there are available tickets
    if (event.pricing.availableTickets < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough tickets available",
      });
    }

    // For free events, directly register the user
    if (event.pricing.isFree) {
      console.log("✅ Processing free event registration");

      // Generate ticket number and QR data for free events
      const ticketNumber = TicketService.generateTicketNumber();
      const qrData = TicketService.generateQRData({
        ticketNumber,
        eventId: id,
        attendeeEmail: req.user.email,
      });

      event.attendees.push({
        user: req.user.id,
        ticketType,
        quantity,
        paymentStatus: "completed",
        bookingDate: new Date(),
        ticketNumber,
        ticketGenerated: true,
        ticketGeneratedAt: new Date(),
        qrData,
      });

      // Update ticket availability
      await event.updateTicketAvailability();

      await event.save();

      return res.status(200).json({
        success: true,
        message: "Successfully registered for the event",
        data: {
          event,
          ticketNumber,
        },
      });
    }

    // For paid events, reject direct registration - must go through payment flow
    console.log("❌ Rejecting paid event registration - payment required");
    return res.status(400).json({
      success: false,
      message: "This is a paid event. Please use the payment flow to register.",
      requiresPayment: true,
      eventDetails: {
        title: event.title,
        tickets: event.pricing.tickets,
      },
    });
  } catch (error) {
    console.error("Register for event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Check user registration status for an event
// @route   GET /api/events/:id/registration-status
// @access  Private
const getRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const registration = event.attendees.find(
      (attendee) => attendee.user.toString() === req.user.id
    );

    res.status(200).json({
      success: true,
      data: {
        isRegistered: !!registration,
        registration: registration || null,
      },
    });
  } catch (error) {
    console.error("Get registration status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get user's registered events
// @route   GET /api/events/my-registrations
// @access  Private (User)
const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const events = await Event.find({
      "attendees.user": userId,
      "dateTime.endDate": { $gte: now }, // Only upcoming events
    })
      .populate("venue", "name address city state")
      .populate("organizer", "name email")
      .sort({ "dateTime.startDate": 1 });

    const registeredEvents = events.map((event) => {
      const registration = event.attendees.find(
        (attendee) => attendee.user.toString() === userId
      );
      return {
        ...event.toObject(),
        registration: {
          ticketType: registration.ticketType,
          quantity: registration.quantity,
          bookingDate: registration.bookingDate,
          paymentStatus: registration.paymentStatus,
          checkInStatus: registration.checkInStatus,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: registeredEvents.length,
      data: registeredEvents,
    });
  } catch (error) {
    console.error("Get my registrations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get user's past attended events
// @route   GET /api/events/my-past-events
// @access  Private (User)
const getMyPastEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const events = await Event.find({
      "attendees.user": userId,
      "dateTime.endDate": { $lt: now }, // Only past events
    })
      .populate("venue", "name address city state")
      .populate("organizer", "name email")
      .sort({ "dateTime.endDate": -1 });

    const pastEvents = events.map((event) => {
      const registration = event.attendees.find(
        (attendee) => attendee.user.toString() === userId
      );
      return {
        ...event.toObject(),
        registration: {
          ticketType: registration.ticketType,
          quantity: registration.quantity,
          bookingDate: registration.bookingDate,
          paymentStatus: registration.paymentStatus,
          checkInStatus: registration.checkInStatus,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: pastEvents.length,
      data: pastEvents,
    });
  } catch (error) {
    console.error("Get my past events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Toggle like/bookmark event
// @route   POST /api/events/:id/toggle-like
// @access  Private (User)
const toggleLikeEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Get user and toggle bookmark
    const user = await User.findById(userId);
    const isLiked = user.bookmarkedEvents.includes(eventId);

    if (isLiked) {
      // Remove from bookmarked events
      user.bookmarkedEvents = user.bookmarkedEvents.filter(
        (id) => id.toString() !== eventId
      );
    } else {
      // Add to bookmarked events
      user.bookmarkedEvents.push(eventId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isLiked: !isLiked,
      message: isLiked ? "Event removed from likes" : "Event liked",
    });
  } catch (error) {
    console.error("Toggle like event error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Get user's liked events
// @route   GET /api/events/my-liked
// @access  Private (User)
const getMyLikedEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate({
      path: "bookmarkedEvents",
      populate: [
        { path: "venue", select: "name address city state" },
        { path: "organizer", select: "name email" },
      ],
      match: { isActive: true }, // Only show active events
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.bookmarkedEvents.length,
      data: user.bookmarkedEvents,
    });
  } catch (error) {
    console.error("Get my liked events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// @desc    Fast search events by city with caching
// @route   GET /api/events/fast-search
// @access  Public
const fastSearchEvents = async (req, res) => {
  const requestStartTime = Date.now();
  console.log(`🚀 [${new Date().toISOString()}] Fast search request started`);

  try {
    const cacheService = require("../services/cacheService");
    const { city, radius = 10, category, search } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City parameter is required",
      });
    }

    console.log(
      `📝 [${new Date().toISOString()}] Fast search request params:`,
      { city, radius, category, search }
    );

    // Build filters object
    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;

    // Get events using cache service
    const serviceStartTime = Date.now();
    const result = await cacheService.getEventsForCity(
      city,
      parseInt(radius),
      filters
    );
    const serviceDuration = Date.now() - serviceStartTime;

    console.log(
      `Fast search result for ${city}: ${
        result.data?.length || 0
      } events, fromCache: ${result.fromCache}`
    );

    console.log("Result structure:", {
      hasData: !!result.data,
      dataLength: result.data?.length,
      fromCache: result.fromCache,
      sampleEvent: result.data?.[0]
        ? {
            title: result.data[0].title,
            venue: result.data[0].venue?.name,
          }
        : null,
    });

    const totalRequestTime = Date.now() - requestStartTime;
    console.log(
      `✅ [${new Date().toISOString()}] Fast search completed for ${city}: ${
        result.data?.length || 0
      } events, fromCache: ${
        result.fromCache
      }, service: ${serviceDuration}ms, total: ${totalRequestTime}ms`
    );

    res.status(200).json({
      success: true,
      message: result.fromCache
        ? "Events retrieved from cache"
        : "Events retrieved from database",
      data: {
        events: result.data,
        city: result.city,
        radius: parseInt(radius),
        filters: result.filters,
        fromCache: result.fromCache,
        timestamp: result.timestamp,
        totalResults: result.data?.length || 0,
      },
    });
  } catch (error) {
    console.error("Fast search events error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get top cities list
// @route   GET /api/events/top-cities
// @access  Public
const getTopCities = async (req, res) => {
  try {
    const cacheService = require("../services/cacheService");
    const topCities = cacheService.getTopCities();

    res.status(200).json({
      success: true,
      message: "Top cities retrieved successfully",
      data: topCities,
    });
  } catch (error) {
    console.error("Get top cities error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get cache statistics
// @route   GET /api/events/cache-stats
// @access  Public
const getCacheStats = async (req, res) => {
  try {
    const cacheService = require("../services/cacheService");
    const stats = await cacheService.getCacheStats();

    res.status(200).json({
      success: true,
      message: "Cache statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get cache stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  createEvent,
  getMyEvents,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  cancelEvent,
  registerForEvent,
  getRegistrationStatus,
  getMyRegistrations,
  getMyPastEvents,
  toggleLikeEvent,
  getMyLikedEvents,
  fastSearchEvents,
  getTopCities,
  getCacheStats,
};
