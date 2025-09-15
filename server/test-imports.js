// Simple test to verify controller functions
const {
  createReview,
  getEventReviews,
  getVenueTopReviews,
} = require("./controllers/reviewController");

console.log("Testing review controller imports...");
console.log("createReview:", typeof createReview);
console.log("getEventReviews:", typeof getEventReviews);
console.log("getVenueTopReviews:", typeof getVenueTopReviews);

if (
  typeof createReview === "function" &&
  typeof getEventReviews === "function" &&
  typeof getVenueTopReviews === "function"
) {
  console.log("✅ All functions imported successfully!");
} else {
  console.log("❌ Some functions are undefined");
}
