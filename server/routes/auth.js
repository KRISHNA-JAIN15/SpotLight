const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  geocodeAddress,
} = require("../controllers/authController");

const {
  validateSignup,
  validateLogin,
  validateEmailResend,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate,
} = require("../middleware/validation");

const { auth } = require("../middleware/auth");

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", validateSignup, signup);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validateLogin, login);

// @route   POST /api/auth/verify-email
// @desc    Verify user email with code
// @access  Public
router.post("/verify-email", verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post(
  "/resend-verification",
  validateEmailResend,
  resendVerificationEmail
);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post("/forgot-password", validateForgotPassword, forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post("/reset-password", validateResetPassword, resetPassword);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, validateProfileUpdate, updateProfile);

// @route   POST /api/auth/geocode
// @desc    Get coordinates for an address
// @access  Private
router.post("/geocode", auth, geocodeAddress);

module.exports = router;
