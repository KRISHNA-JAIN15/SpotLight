const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth");
const appRoutes = require("./app");
const venueRoutes = require("./venues");
const eventRoutes = require("./events");
const adminRoutes = require("./admin");
const paymentRoutes = require("./paymentRoutes");
const ticketRoutes = require("./ticketRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/app", appRoutes);
router.use("/venues", venueRoutes);
router.use("/events", eventRoutes);
router.use("/admin", adminRoutes);
router.use("/payments", paymentRoutes);
router.use("/tickets", ticketRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// Default route for API documentation or welcome message
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Spotlight Events API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      app: "/api/app",
      venues: "/api/venues",
      events: "/api/events",
      admin: "/api/admin",
      payments: "/api/payments",
      tickets: "/api/tickets",
      health: "/api/health",
    },
    authFlow: {
      step1: "POST /api/auth/signup - Register with email and password",
      step2: "GET /api/auth/verify-email?token=... - Verify email from link",
      step3:
        "POST /api/auth/login - Login (will indicate profile completion needed)",
      step4: "PUT /api/auth/profile - Complete profile with required fields",
      step5: "Access to /api/app/* routes only after profile completion",
    },
  });
});

module.exports = router;
