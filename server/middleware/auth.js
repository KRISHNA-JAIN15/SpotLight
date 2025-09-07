const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to authenticate and protect routes
const auth = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Token is invalid. User not found.",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "Account has been deactivated.",
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(401).json({
          success: false,
          message: "Please verify your email to access this resource.",
          requiresVerification: true,
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (tokenError) {
      console.error("Token verification error:", tokenError);
      return res.status(401).json({
        success: false,
        message: "Token is invalid.",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Middleware to check if user is an event manager
const checkEventManager = (req, res, next) => {
  if (req.user.type !== "event_manager") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Event manager privileges required.",
    });
  }
  next();
};

// Middleware for optional authentication (for routes that work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.userId).select("-password");

        if (user && user.isActive && user.isVerified) {
          req.user = user;
        }
      } catch (tokenError) {
        // Token invalid, but continue without user
        console.log("Optional auth - invalid token:", tokenError.message);
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue without authentication
  }
};

// Middleware to check if user has completed their profile
const requireProfileCompletion = (req, res, next) => {
  if (!req.user.isProfileCompleted) {
    return res.status(403).json({
      success: false,
      message: "Please complete your profile before accessing this resource.",
      requiresProfileCompletion: true,
    });
  }
  next();
};

module.exports = {
  auth,
  checkEventManager,
  optionalAuth,
  requireProfileCompletion,
};
