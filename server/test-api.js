// Test to see what's being imported from reviewController
console.log("Testing review controller imports...");

try {
  const controller = require("./controllers/reviewController");
  console.log("Controller object:", Object.keys(controller));

  const { createReview, getEventReviews, getVenueTopReviews } = controller;

  console.log("createReview:", typeof createReview, createReview ? "✅" : "❌");
  console.log(
    "getEventReviews:",
    typeof getEventReviews,
    getEventReviews ? "✅" : "❌"
  );
  console.log(
    "getVenueTopReviews:",
    typeof getVenueTopReviews,
    getVenueTopReviews ? "✅" : "❌"
  );
} catch (error) {
  console.error("Error importing controller:", error.message);
  console.error("Stack:", error.stack);
}

// 1. Health Check
console.log("=== HEALTH CHECK ===");
console.log(`GET ${API_BASE_URL}/health`);
console.log("Expected: 200 OK with health status");

// 2. User Signup
console.log("\n=== USER SIGNUP ===");
console.log(`POST ${API_BASE_URL}/auth/signup`);
console.log("Body:", JSON.stringify(testUser, null, 2));
console.log("Expected: 201 Created with user data and verification message");

// 3. Login (Should fail - email not verified)
console.log("\n=== LOGIN (UNVERIFIED) ===");
console.log(`POST ${API_BASE_URL}/auth/login`);
console.log(
  "Body:",
  JSON.stringify(
    {
      email: testUser.email,
      password: testUser.password,
    },
    null,
    2
  )
);
console.log("Expected: 401 Unauthorized with verification required message");

// 4. Resend Verification Email
console.log("\n=== RESEND VERIFICATION ===");
console.log(`POST ${API_BASE_URL}/auth/resend-verification`);
console.log(
  "Body:",
  JSON.stringify(
    {
      email: testUser.email,
    },
    null,
    2
  )
);
console.log("Expected: 200 OK with email sent message");

// 5. Verify Email (Manual step)
console.log("\n=== EMAIL VERIFICATION ===");
console.log(
  `GET ${API_BASE_URL}/auth/verify-email?token=VERIFICATION_TOKEN_FROM_EMAIL`
);
console.log("Expected: 200 OK with verification success message");

// 6. Login (Should succeed after verification)
console.log("\n=== LOGIN (VERIFIED) ===");
console.log(`POST ${API_BASE_URL}/auth/login`);
console.log(
  "Body:",
  JSON.stringify(
    {
      email: testUser.email,
      password: testUser.password,
    },
    null,
    2
  )
);
console.log(
  "Expected: 200 OK with JWT token, user data, and requiresProfileCompletion: true"
);

// 7. Update Profile (Complete profile)
console.log("\n=== UPDATE PROFILE ===");
const profileData = {
  name: "John Doe",
  phone: "+1234567890",
  dateOfBirth: "1990-01-15",
  bio: "Event enthusiast from Mumbai",
  location: {
    address: "123 Main Street, Andheri",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    coordinates: [72.8777, 19.076], // [longitude, latitude] for Mumbai
  },
  preferences: {
    categories: ["music", "tech", "food"],
    radius: 10,
  },
  socialLinks: {
    instagram: "https://instagram.com/johndoe",
    linkedin: "https://linkedin.com/in/johndoe",
  },
};
console.log(`PUT ${API_BASE_URL}/auth/profile`);
console.log("Headers: Authorization: Bearer JWT_TOKEN_FROM_LOGIN");
console.log("Body:", JSON.stringify(profileData, null, 2));
console.log(
  "Expected: 200 OK with updated profile and isProfileCompleted: true"
);

// 8. Check Profile Status
console.log("\n=== CHECK PROFILE STATUS ===");
console.log(`GET ${API_BASE_URL}/app/profile-status`);
console.log("Headers: Authorization: Bearer JWT_TOKEN");
console.log("Expected: 200 OK with profile completion details");

// 9. Access Protected Dashboard (Should work after profile completion)
console.log("\n=== ACCESS DASHBOARD ===");
console.log(`GET ${API_BASE_URL}/app/dashboard`);
console.log("Headers: Authorization: Bearer JWT_TOKEN");
console.log(
  "Expected: 200 OK with dashboard data (only works with completed profile)"
);

// 10. Get Current User (Protected route)
console.log("\n=== GET CURRENT USER ===");
console.log(`GET ${API_BASE_URL}/auth/me`);
console.log("Headers: Authorization: Bearer JWT_TOKEN_FROM_LOGIN");
console.log("Expected: 200 OK with user profile data");

// 8. Forgot Password
console.log("\n=== FORGOT PASSWORD ===");
console.log(`POST ${API_BASE_URL}/auth/forgot-password`);
console.log(
  "Body:",
  JSON.stringify(
    {
      email: testUser.email,
    },
    null,
    2
  )
);
console.log("Expected: 200 OK with reset email sent message");

// 9. Reset Password (Manual step)
console.log("\n=== RESET PASSWORD ===");
console.log(`POST ${API_BASE_URL}/auth/reset-password`);
console.log(
  "Body:",
  JSON.stringify(
    {
      token: "RESET_TOKEN_FROM_EMAIL",
      password: "NewPassword123",
    },
    null,
    2
  )
);
console.log("Expected: 200 OK with password reset success message");

console.log("\n=== TESTING NOTES ===");
console.log("1. Start with health check to ensure server is running");
console.log("2. Sign up a new user");
console.log("3. Try to login (should fail due to unverified email)");
console.log("4. Check email for verification link and verify");
console.log(
  "5. Login again (should succeed but show requiresProfileCompletion: true)"
);
console.log("6. Update profile with all required fields to complete profile");
console.log("7. Check profile status to confirm completion");
console.log(
  "8. Access protected app routes (dashboard, events) - only works with completed profile"
);
console.log("9. Test password reset flow if needed");

console.log("\n=== CURL EXAMPLES ===");
console.log("# Health Check");
console.log(`curl -X GET "${API_BASE_URL}/health"`);

console.log("\n# Signup");
console.log(`curl -X POST "${API_BASE_URL}/auth/signup" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log(`  -d '${JSON.stringify(testUser)}'`);

console.log("\n# Login");
console.log(`curl -X POST "${API_BASE_URL}/auth/login" \\`);
console.log('  -H "Content-Type: application/json" \\');
console.log(
  `  -d '{"email":"${testUser.email}","password":"${testUser.password}"}'`
);

console.log("\n# Get Current User (replace JWT_TOKEN with actual token)");
console.log(`curl -X GET "${API_BASE_URL}/auth/me" \\`);
console.log('  -H "Authorization: Bearer JWT_TOKEN"');
