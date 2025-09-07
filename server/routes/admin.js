const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getAllVenues,
  getUserDetails,
  getAllEvents,
} = require("../controllers/adminController");

const { auth } = require("../middleware/auth");

// All routes require admin authentication
router.use(auth);

// Dashboard stats
router.get("/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id/status", updateUserStatus);

// Venue management
router.get("/venues", getAllVenues);

// Event management
router.get("/events", getAllEvents);

module.exports = router;
