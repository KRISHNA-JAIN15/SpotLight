// Simple test for review controller imports
console.log("Testing review controller imports...");

try {
  const controller = require("./controllers/reviewController");
  console.log("✅ Controller imported successfully");
  console.log("Available functions:", Object.keys(controller));

  const { createReview, getEventReviews, getVenueTopReviews } = controller;

  console.log("createReview:", typeof createReview);
  console.log("getEventReviews:", typeof getEventReviews);
  console.log("getVenueTopReviews:", typeof getVenueTopReviews);

  if (
    typeof createReview === "function" &&
    typeof getEventReviews === "function" &&
    typeof getVenueTopReviews === "function"
  ) {
    console.log("✅ All required functions are available!");
  } else {
    console.log("❌ Some functions are not available");
  }
} catch (error) {
  console.error("❌ Error importing controller:");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
}
