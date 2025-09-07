const { body } = require("express-validator");

// Validation rules for user signup
const validateSignup = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name should only contain letters and spaces"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  body("type")
    .optional()
    .isIn(["user", "event_manager", "admin"])
    .withMessage('Type must be either "user", "event_manager", or "admin"'),

  body("phone")
    .optional()
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number"),
];

// Validation rules for user login
const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

// Validation rules for email resend
const validateEmailResend = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

// Validation rules for forgot password
const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
];

// Validation rules for reset password
const validateResetPassword = [
  body("token").notEmpty().withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

// Validation rules for profile update
const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Name should only contain letters and spaces"),

  body("phone")
    .optional()
    .isMobilePhone("any")
    .withMessage("Please provide a valid phone number"),

  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date of birth (YYYY-MM-DD)"),

  body("bio")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Bio must not exceed 500 characters"),

  body("location.address")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be between 5 and 200 characters"),

  body("location.city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("location.state")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("location.country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("location.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of [longitude, latitude]"),

  body("location.coordinates.*")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Coordinates must be valid longitude and latitude values"),

  body("preferences.categories")
    .optional()
    .isArray()
    .withMessage("Categories must be an array"),

  body("preferences.categories.*")
    .optional()
    .isIn([
      "music",
      "sports",
      "tech",
      "food",
      "art",
      "business",
      "education",
      "entertainment",
      "health",
      "other",
    ])
    .withMessage("Invalid category"),

  body("preferences.radius")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Radius must be between 1 and 100 kilometers"),

  body("socialLinks.instagram")
    .optional()
    .isURL()
    .withMessage("Please provide a valid Instagram URL"),

  body("socialLinks.twitter")
    .optional()
    .isURL()
    .withMessage("Please provide a valid Twitter URL"),

  body("socialLinks.linkedin")
    .optional()
    .isURL()
    .withMessage("Please provide a valid LinkedIn URL"),

  body("socialLinks.facebook")
    .optional()
    .isURL()
    .withMessage("Please provide a valid Facebook URL"),
];

const validateVenueCreation = [
  body("name")
    .notEmpty()
    .withMessage("Venue name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Venue name must be between 3 and 100 characters"),

  body("description")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Venue description must not exceed 1000 characters"),

  body("venueType")
    .notEmpty()
    .withMessage("Venue type is required")
    .isIn([
      "auditorium",
      "stadium",
      "conference_hall",
      "outdoor_space",
      "club",
      "restaurant",
      "theater",
      "arena",
      "park",
      "gallery",
      "other",
    ])
    .withMessage("Please select a valid venue type"),

  body("capacity")
    .notEmpty()
    .withMessage("Venue capacity is required")
    .isInt({ min: 1, max: 100000 })
    .withMessage("Capacity must be between 1 and 100,000"),

  body("address.street")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Street address must not exceed 200 characters"),

  body("address.city")
    .notEmpty()
    .withMessage("City is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("address.state")
    .notEmpty()
    .withMessage("State is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("address.country")
    .notEmpty()
    .withMessage("Country is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Country must be between 2 and 50 characters"),

  body("address.pincode")
    .optional()
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be 6 digits"),

  body("contact.phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  body("contact.email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("contact.website")
    .optional()
    .isURL()
    .withMessage("Please provide a valid website URL"),

  body("amenities")
    .optional()
    .isArray()
    .withMessage("Amenities must be an array"),

  body("amenities.*")
    .optional()
    .isIn([
      "parking",
      "wifi",
      "ac",
      "sound_system",
      "projector",
      "catering",
      "security",
      "accessibility",
      "restrooms",
      "bar",
      "stage",
      "lighting",
    ])
    .withMessage("Invalid amenity selected"),

  body("images").optional().isArray().withMessage("Images must be an array"),

  body("images.*.url")
    .optional()
    .isURL()
    .withMessage("Please provide valid image URLs"),

  body("images.*.caption")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Image caption must not exceed 200 characters"),

  body("location.coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of [longitude, latitude]"),

  body("location.coordinates.*")
    .optional()
    .isFloat()
    .withMessage("Coordinates must be valid numbers"),
];

const validateEventCreation = [
  body("title")
    .notEmpty()
    .withMessage("Event title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Event title must be between 3 and 100 characters"),

  body("description")
    .notEmpty()
    .withMessage("Event description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Event description must be between 10 and 2000 characters"),

  body("category")
    .notEmpty()
    .withMessage("Event category is required")
    .isIn([
      "music",
      "sports",
      "arts",
      "food",
      "technology",
      "business",
      "health",
      "education",
      "entertainment",
      "other",
    ])
    .withMessage("Please select a valid event category"),

  body("type")
    .notEmpty()
    .withMessage("Event type is required")
    .isIn(["free", "paid"])
    .withMessage("Event type must be either 'free' or 'paid'"),

  body("venue")
    .notEmpty()
    .withMessage("Venue is required")
    .isMongoId()
    .withMessage("Please provide a valid venue ID"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Please provide a valid start date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Start date must be in the future");
      }
      return true;
    }),

  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Please provide a valid end date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("maxAttendees")
    .notEmpty()
    .withMessage("Maximum attendees is required")
    .isInt({ min: 1, max: 100000 })
    .withMessage("Maximum attendees must be between 1 and 100,000"),

  body("pricing.general")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("General ticket price must be a positive number"),

  body("pricing.vip")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("VIP ticket price must be a positive number"),

  body("pricing.premium")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Premium ticket price must be a positive number"),

  body("tags").optional().isArray().withMessage("Tags must be an array"),

  body("images").optional().isArray().withMessage("Images must be an array"),

  body("contactEmail")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid contact email"),

  body("contactPhone")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid contact phone number"),
];

module.exports = {
  validateSignup,
  validateLogin,
  validateEmailResend,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate,
  validateVenueCreation,
  validateEventCreation,
};
