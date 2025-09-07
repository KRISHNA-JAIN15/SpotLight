const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/eventController");

const { auth } = require("../middleware/auth");
const { validateEventCreation } = require("../middleware/validation");

// Public routes
router.get("/", getAllEvents);
router.get("/fast-search", fastSearchEvents);
router.get("/top-cities", getTopCities);
router.get("/cache-stats", getCacheStats);

// Protected routes (Event Manager) - specific routes before parameterized ones
router.post("/", auth, validateEventCreation, createEvent);
router.get("/my-events", auth, getMyEvents);
router.get("/my-registrations", auth, getMyRegistrations);
router.get("/my-past-events", auth, getMyPastEvents);
router.get("/my-liked", auth, getMyLikedEvents);

// Parameterized routes (must come after specific routes)
router.get("/:id", getEventById);
router.put("/:id", auth, updateEvent);
router.delete("/:id", auth, deleteEvent);
router.put("/:id/cancel", auth, cancelEvent);

// Event registration routes
router.post("/:id/register", auth, registerForEvent);
router.get("/:id/registration-status", auth, getRegistrationStatus);
router.post("/:id/toggle-like", auth, toggleLikeEvent);

module.exports = router;
