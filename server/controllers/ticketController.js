const Event = require("../models/Event");
const User = require("../models/User");
const Venue = require("../models/Venue");
const TicketService = require("../services/ticketService");

// Generate ticket after successful registration/payment
const generateTicket = async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    if (!eventId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Event ID and User ID are required",
      });
    }

    // Find the event and populate venue details
    const event = await Event.findById(eventId).populate("venue");
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Find the attendee record
    const attendeeRecord = event.attendees.find(
      (attendee) =>
        attendee.user.toString() === userId &&
        attendee.paymentStatus === "completed"
    );

    if (!attendeeRecord) {
      return res.status(404).json({
        success: false,
        message: "No valid registration found for this event",
      });
    }

    // Check if ticket already generated
    if (attendeeRecord.ticketGenerated) {
      return res.status(400).json({
        success: false,
        message: "Ticket already generated for this registration",
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate ticket number and QR data
    const ticketNumber = TicketService.generateTicketNumber();
    const qrData = TicketService.generateQRData({
      ticketNumber,
      eventId,
      attendeeEmail: user.email,
    });

    // Prepare ticket data
    const ticketData = {
      eventTitle: event.title,
      eventDate: new Date(event.dateTime.startDate).toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ),
      eventTime: event.dateTime.startTime || "TBD",
      eventLocation: `${event.venue.name}, ${event.venue.address.city}`,
      attendeeName: `${user.firstName} ${user.lastName}`,
      attendeeEmail: user.email,
      ticketType: attendeeRecord.ticketType || "General",
      ticketNumber,
      qrData,
    };

    // Generate PDF ticket
    const pdfBuffer = await TicketService.generateTicket(ticketData);

    // Update attendee record with ticket information
    attendeeRecord.ticketNumber = ticketNumber;
    attendeeRecord.ticketGenerated = true;
    attendeeRecord.ticketGeneratedAt = new Date();
    attendeeRecord.qrData = qrData;

    await event.save();

    // Send PDF as response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ticket-${ticketNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate ticket",
      error: error.message,
    });
  }
};

// Download existing ticket
const downloadTicket = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    if (!eventId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Event ID and User ID are required",
      });
    }

    // Find the event and populate venue details
    const event = await Event.findById(eventId).populate("venue");
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Find the attendee record
    const attendeeRecord = event.attendees.find(
      (attendee) =>
        attendee.user.toString() === userId &&
        attendee.paymentStatus === "completed"
    );

    if (!attendeeRecord) {
      return res.status(404).json({
        success: false,
        message:
          "No valid ticket found for this event. Please ensure you have completed payment.",
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate ticket data if it doesn't exist
    let ticketNumber = attendeeRecord.ticketNumber;
    let qrData = attendeeRecord.qrData;

    if (!ticketNumber || !qrData) {
      // Generate ticket number and QR data
      ticketNumber = TicketService.generateTicketNumber();
      qrData = TicketService.generateQRData(event._id, userId, ticketNumber);

      // Update attendee record
      attendeeRecord.ticketNumber = ticketNumber;
      attendeeRecord.ticketGenerated = true;
      attendeeRecord.ticketGeneratedAt = new Date();
      attendeeRecord.qrData = qrData;

      // Save the updated event
      await event.save();
    }

    // Prepare ticket data
    const ticketData = {
      eventTitle: event.title,
      eventDate: new Date(event.dateTime.startDate).toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      ),
      eventTime: event.dateTime.startTime || "TBD",
      eventLocation: `${event.venue.name}, ${event.venue.address.city}`,
      attendeeName: `${user.firstName} ${user.lastName}`,
      attendeeEmail: user.email,
      ticketType: attendeeRecord.ticketType || "General",
      ticketNumber: ticketNumber,
      qrData: qrData,
    };

    // Generate PDF ticket
    const pdfBuffer = await TicketService.generateTicket(ticketData);

    // Send PDF as response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ticket-${ticketNumber}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error downloading ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download ticket",
      error: error.message,
    });
  }
};

// Get user's tickets
const getUserTickets = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find all events where user is registered
    const events = await Event.find({
      "attendees.user": userId,
      "attendees.paymentStatus": "completed",
    })
      .populate("venue")
      .select("title dateTime venue attendees");

    // Filter and format user's tickets
    const userTickets = events
      .map((event) => {
        const attendeeRecord = event.attendees.find(
          (attendee) =>
            attendee.user.toString() === userId &&
            attendee.paymentStatus === "completed"
        );

        return {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.dateTime.startDate,
          eventLocation: `${event.venue.name}, ${event.venue.address.city}`,
          ticketType: attendeeRecord.ticketType || "General",
          ticketNumber: attendeeRecord.ticketNumber,
          ticketGenerated: attendeeRecord.ticketGenerated,
          ticketGeneratedAt: attendeeRecord.ticketGeneratedAt,
          registrationDate: attendeeRecord.bookingDate,
        };
      })
      .filter((ticket) => ticket.ticketGenerated);

    res.status(200).json({
      success: true,
      tickets: userTickets,
    });
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

// Verify ticket (for event organizers/staff)
const verifyTicket = async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    if (!ticketNumber) {
      return res.status(400).json({
        success: false,
        message: "Ticket number is required",
      });
    }

    // Find event with this ticket
    const event = await Event.findOne({
      "attendees.ticketNumber": ticketNumber,
    })
      .populate("venue")
      .populate("attendees.user");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Invalid ticket number",
      });
    }

    const attendeeRecord = event.attendees.find(
      (attendee) => attendee.ticketNumber === ticketNumber
    );

    if (!attendeeRecord || attendeeRecord.paymentStatus !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Invalid or unpaid ticket",
      });
    }

    const user = attendeeRecord.user;

    res.status(200).json({
      success: true,
      ticket: {
        ticketNumber: attendeeRecord.ticketNumber,
        eventTitle: event.title,
        eventDate: event.dateTime.startDate,
        attendeeName: `${user.firstName} ${user.lastName}`,
        attendeeEmail: user.email,
        ticketType: attendeeRecord.ticketType,
        checkInStatus: attendeeRecord.checkInStatus,
        registrationDate: attendeeRecord.bookingDate,
      },
    });
  } catch (error) {
    console.error("Error verifying ticket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify ticket",
      error: error.message,
    });
  }
};

module.exports = {
  generateTicket,
  downloadTicket,
  getUserTickets,
  verifyTicket,
};
