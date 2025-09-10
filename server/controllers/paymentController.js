const Razorpay = require("razorpay");
const crypto = require("crypto");
const Event = require("../models/Event");
const TicketService = require("../services/ticketService");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// @desc    Create payment order
// @route   POST /api/payments/create-order
// @access  Private
const createPaymentOrder = async (req, res) => {
  try {
    const { eventId, ticketType, quantity } = req.body;

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if event is paid
    if (event.pricing.isFree) {
      return res.status(400).json({
        success: false,
        message: "This event is free",
      });
    }

    // Find the ticket type
    const ticket = event.pricing.tickets.find((t) => t.type === ticketType);
    if (!ticket) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket type",
      });
    }

    // Check ticket availability
    if (ticket.quantity.available < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough tickets available",
      });
    }

    // Calculate total amount
    const totalAmount = ticket.price * quantity;

    // Create Razorpay order
    const options = {
      amount: totalAmount * 100, // amount in paise
      currency: "INR",
      receipt: `evt_${eventId.slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: {
        eventId,
        ticketType,
        quantity: quantity.toString(),
        userId: req.user.id,
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: totalAmount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_API_KEY,
        eventDetails: {
          title: event.title,
          ticketType,
          quantity,
          pricePerTicket: ticket.price,
        },
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};

// @desc    Verify payment and complete registration
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      ticketType,
      quantity,
    } = req.body;

    // Check if all required parameters are present
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification parameters",
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
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

    // Find the ticket type and verify availability
    const ticket = event.pricing.tickets.find((t) => t.type === ticketType);
    if (!ticket || ticket.quantity.available < quantity) {
      return res.status(400).json({
        success: false,
        message: "Tickets no longer available",
      });
    }

    // Calculate total amount
    const totalAmount = ticket.price * quantity;

    // Generate ticket number and QR data for this registration
    const ticketNumber = TicketService.generateTicketNumber();
    const qrData = TicketService.generateQRData({
      ticketNumber,
      eventId,
      attendeeEmail: req.user.email,
    });

    // Register the user for the event
    event.attendees.push({
      user: req.user.id,
      ticketType,
      quantity,
      paymentStatus: "completed",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      totalAmount,
      ticketNumber,
      ticketGenerated: true,
      ticketGeneratedAt: new Date(),
      qrData,
      bookingDate: new Date(),
    });

    // Update ticket quantities
    ticket.quantity.available -= quantity;
    ticket.quantity.sold += quantity;

    await event.save();

    res.status(200).json({
      success: true,
      message: "Payment verified and registration completed successfully",
      data: {
        paymentId: razorpay_payment_id,
        ticketNumber,
        registrationDetails: {
          eventTitle: event.title,
          ticketType,
          quantity,
          totalAmount,
        },
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};

// @desc    Get Razorpay key
// @route   GET /api/payments/key
// @access  Public
const getRazorpayKey = async (req, res) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_API_KEY,
  });
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getRazorpayKey,
};
