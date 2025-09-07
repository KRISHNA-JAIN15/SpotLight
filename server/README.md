# Spotlight Events - Authentication API

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update the environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A strong secret key for JWT tokens
     - `SMTP_USER` & `SMTP_PASS`: Gmail credentials for sending emails
     - `FRONTEND_URL`: Your frontend application URL

3. **Start the Server**
   ```bash
   npm start
   # or for development with nodemon
   npm run dev
   ```

## Authentication Endpoints

### 1. User Signup
```
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "type": "user", // Optional: "user" or "event_manager"
  "phone": "+1234567890" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "type": "user",
      "isVerified": false
    }
  }
}
```

### 2. Email Verification
```
GET /api/auth/verify-email?token=verification_token
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully. You can now login to your account.",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "isVerified": true
    }
  }
}
```

### 3. User Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "type": "user",
      "isVerified": true,
      "isProfileCompleted": false,
      "lastLogin": "2025-09-04T10:30:00.000Z"
    }
  }
}
```

**Error Response (Unverified Email):**
```json
{
  "success": false,
  "message": "Please verify your email before logging in. Check your inbox for verification email.",
  "requiresVerification": true,
  "userEmail": "john@example.com"
}
```

### 4. Resend Verification Email
```
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### 5. Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### 6. Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "password": "NewPassword123"
}
```

### 7. Get Current User (Protected Route)
```
GET /api/auth/me
Authorization: Bearer jwt_token_here
```

## Authentication Flow

1. **User Registration:**
   - User signs up with email and password
   - Verification email is sent
   - User cannot login until email is verified

2. **Email Verification:**
   - User clicks verification link from email
   - Account becomes verified
   - User can now login

3. **Login:**
   - User provides email and password
   - System checks if email is verified
   - If verified, JWT token is returned
   - If not verified, login is rejected with verification message

4. **Protected Routes:**
   - Include `Authorization: Bearer <token>` header
   - Middleware validates token and user status
   - Only verified users can access protected routes

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [ // Only for validation errors
    {
      "field": "email",
      "message": "Please provide a valid email"
    }
  ]
}
```

## Security Features

- **Password Hashing:** bcryptjs with salt rounds
- **JWT Tokens:** Secure token-based authentication
- **Rate Limiting:** Prevents brute force attacks
- **Email Verification:** Required before login
- **Input Validation:** Comprehensive validation rules
- **CORS Protection:** Configured for frontend integration
- **Helmet Security:** Security headers middleware

## Password Requirements

- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Rate Limits

- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 20 requests per 15 minutes per IP
