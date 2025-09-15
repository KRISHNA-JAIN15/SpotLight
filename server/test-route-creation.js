// Test exact import pattern from reviewRoutes.js
console.log("Testing exact import pattern...");

try {
  const express = require("express");
  console.log("✅ Express imported");

  const router = express.Router();
  console.log("✅ Router created");

  const {
    createReview,
    getEventReviews,
    getVenueTopReviews,
  } = require("./controllers/reviewController");
  console.log("✅ Review controller functions imported");

  const auth = require("./middleware/auth");
  console.log("✅ Auth middleware imported");
  console.log("Auth type:", typeof auth);

  // Test if auth is actually a function or object with auth property
  const authFunction = typeof auth === "function" ? auth : auth.auth;
  console.log("Auth function type:", typeof authFunction);

  console.log("createReview type:", typeof createReview);
  console.log("getEventReviews type:", typeof getEventReviews);
  console.log("getVenueTopReviews type:", typeof getVenueTopReviews);

  // Test route creation (this is where the error occurs)
  console.log("Testing route creation...");
  router.post("/test", authFunction, createReview);
  console.log("✅ POST route created successfully");

  router.get("/test/:id", getEventReviews);
  console.log("✅ GET routes created successfully");

  console.log("🎉 All imports and route creation successful!");
} catch (error) {
  console.error("❌ Error occurred:");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
}
