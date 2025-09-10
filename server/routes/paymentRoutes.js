const express = require("express");
const {
  createPaymentOrder,
  verifyPayment,
  getRazorpayKey,
} = require("../controllers/paymentController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.get("/key", getRazorpayKey);

// Protected routes
router.use(auth); // Apply authentication to all routes below

router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);

module.exports = router;
