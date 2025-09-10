const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const { auth } = require("../middleware/auth");

// Generate ticket after successful registration/payment
router.post("/generate", auth, ticketController.generateTicket);

// Download existing ticket
router.get("/download/:eventId/:userId", auth, ticketController.downloadTicket);

// Get user's tickets
router.get("/user/:userId", auth, ticketController.getUserTickets);

// Verify ticket (for event organizers/staff)
router.get("/verify/:ticketNumber", ticketController.verifyTicket);

module.exports = router;
