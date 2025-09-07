const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");
const {
  getCoordinatesFromAddress,
  geocodeWithFallback,
  validateCoordinates,
} = require("../utils/geocoding");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
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

    const { name, email, password, type = "user", phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification code (6 digits)
    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      type,
      phone: phone?.trim(),
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpires: codeExpires,
      isVerified: false,
      isActive: true,
    });

    await user.save();

    // Send verification email with code
    const emailSent = await sendVerificationEmail(
      user.email,
      verificationCode,
      user.name
    );

    if (!emailSent) {
      console.error("Failed to send verification email to:", user.email);
    }

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          type: user.type,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
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

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message:
          "Please verify your email before logging in. Check your inbox for verification email.",
        requiresVerification: true,
        userEmail: user.email,
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          type: user.type,
          isVerified: user.isVerified,
          isProfileCompleted: user.isProfileCompleted,
          profilePicture: user.profilePicture,
          lastLogin: user.lastLogin,
        },
        requiresProfileCompletion: !user.isProfileCompleted,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({
        success: false,
        message: "Verification code and email are required",
      });
    }

    // Find user with verification code
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      emailVerificationCode: code,
      emailVerificationCodeExpires: { $gt: Date.now() },
      isActive: true,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Verify the user
    user.isVerified = true;
    user.emailVerificationCode = undefined; // Remove the code
    user.emailVerificationCodeExpires = undefined; // Remove expiry
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Email verified successfully. You can now login to your account.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          type: user.type,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpires = codeExpires;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(
      user.email,
      verificationCode,
      user.name
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message:
          "If an account with this email exists, you will receive a password reset link.",
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Please verify your email first before requesting password reset.",
      });
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send reset email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name
    );

    if (!emailSent) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // Find user with reset token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -emailVerificationToken -passwordResetToken -passwordResetExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
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

    const userId = req.user.id;
    const {
      name,
      phone,
      dateOfBirth,
      bio,
      location,
      preferences,
      socialLinks,
      profilePicture,
    } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user fields
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (dateOfBirth) user.dateOfBirth = new Date(dateOfBirth);
    if (bio !== undefined) user.bio = bio.trim();
    if (profilePicture) user.profilePicture = profilePicture;

    // Update location if provided
    if (location) {
      user.location = {
        ...user.location,
        ...location,
      };

      // Geocode the address if location details are provided
      let coordinatesUpdated = false;
      if (location.address || location.city || location.state) {
        try {
          console.log("Geocoding address:", {
            address: location.address || user.location.address,
            city: location.city || user.location.city,
            state: location.state || user.location.state,
            country: location.country || user.location.country || "India",
          });

          const geoResult = await geocodeWithFallback(
            location.address || user.location.address,
            location.city || user.location.city,
            location.state || user.location.state,
            location.country || user.location.country || "India"
          );

          if (
            geoResult &&
            validateCoordinates(geoResult.latitude, geoResult.longitude)
          ) {
            user.location.coordinates = [
              geoResult.longitude,
              geoResult.latitude,
            ]; // [longitude, latitude] for MongoDB
            coordinatesUpdated = true;
            console.log("Coordinates updated:", user.location.coordinates);
          } else {
            console.log("Geocoding failed or returned invalid coordinates");
          }
        } catch (geocodeError) {
          console.error("Geocoding error:", geocodeError.message);
          // Continue with profile update even if geocoding fails
        }
      }

      // If coordinates are manually provided, use them (this overrides geocoding)
      if (
        location.coordinates &&
        Array.isArray(location.coordinates) &&
        location.coordinates.length === 2
      ) {
        const lat = parseFloat(location.coordinates[1]);
        const lng = parseFloat(location.coordinates[0]);

        if (validateCoordinates(lat, lng)) {
          user.location.coordinates = [lng, lat]; // [longitude, latitude] for MongoDB
          coordinatesUpdated = true;
          console.log("Manual coordinates updated:", user.location.coordinates);
        } else {
          console.log("Invalid manual coordinates provided");
        }
      }
    }

    // Update preferences if provided
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    // Update social links if provided
    if (socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...socialLinks,
      };
    }

    // Check if profile is now complete (different requirements for different user types)
    let isProfileComplete = false;

    if (user.type === "event_manager") {
      // Event managers don't need preferences/categories
      isProfileComplete = !!(
        user.name &&
        user.phone &&
        user.dateOfBirth &&
        user.location &&
        user.location.city &&
        user.location.state &&
        user.location.country
      );
    } else {
      // Regular users need preferences with categories
      isProfileComplete = !!(
        user.name &&
        user.phone &&
        user.dateOfBirth &&
        user.location &&
        user.location.city &&
        user.location.state &&
        user.location.country &&
        user.preferences &&
        user.preferences.categories &&
        user.preferences.categories.length > 0
      );
    }

    user.isProfileCompleted = isProfileComplete;

    // Save the updated user
    await user.save();

    // Return updated user data (excluding sensitive information)
    const updatedUser = await User.findById(userId).select(
      "-password -emailVerificationToken -passwordResetToken -passwordResetExpires"
    );

    res.status(200).json({
      success: true,
      message: isProfileComplete
        ? "Profile updated and completed successfully! You now have full access to the platform."
        : "Profile updated successfully. Please complete all required fields to access all features.",
      data: {
        user: updatedUser,
        isProfileCompleted: isProfileComplete,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get coordinates for an address
// @route   POST /api/auth/geocode
// @access  Private
const geocodeAddress = async (req, res) => {
  try {
    const { address, city, state, pincode, country = "India" } = req.body;

    if (!address && !city && !state) {
      return res.status(400).json({
        success: false,
        message: "At least one of address, city, or state is required",
      });
    }

    const geoResult = await geocodeWithFallback(
      address,
      city,
      state,
      pincode,
      country
    );

    if (!geoResult) {
      return res.status(404).json({
        success: false,
        message: "Unable to find coordinates for the provided address",
      });
    }

    if (!validateCoordinates(geoResult.latitude, geoResult.longitude)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates returned from geocoding service",
      });
    }

    res.status(200).json({
      success: true,
      message: "Coordinates found successfully",
      data: {
        latitude: geoResult.latitude,
        longitude: geoResult.longitude,
        displayName: geoResult.displayName,
        confidence: geoResult.confidence,
        coordinates: [geoResult.longitude, geoResult.latitude], // MongoDB format
      },
    });
  } catch (error) {
    console.error("Geocoding error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during geocoding",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  signup,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  geocodeAddress,
};
