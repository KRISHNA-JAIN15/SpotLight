const express = require("express");
const router = express.Router();

const {
  createVenue,
  getMyVenues,
  getAllVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
  getPendingVenues,
  updateVenueApproval,
} = require("../controllers/venueController");

const { auth } = require("../middleware/auth");
const { validateVenueCreation } = require("../middleware/validation");

// Public routes
router.get("/", getAllVenues);

// Protected routes (Event Manager) - specific routes before parameterized ones
router.post("/", auth, validateVenueCreation, createVenue);
router.get("/my/venues", auth, getMyVenues);

// Admin routes
router.get("/admin/pending", auth, getPendingVenues);

// Parameterized routes (must come after specific routes)
router.get("/:id", getVenueById);
router.put("/:id", auth, updateVenue);
router.delete("/:id", auth, deleteVenue);
router.put("/:id/approval", auth, updateVenueApproval);

module.exports = router;
