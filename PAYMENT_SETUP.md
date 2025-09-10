# Payment Integration Setup Guide

## Overview
The Spotlight Events platform now includes integrated payment functionality using Razorpay for paid events. Users can select ticket types and complete payments before registration.

## Features Implemented

### 1. **Ticket Selection Modal**
- Users can view available ticket types with pricing
- Select quantities for different ticket tiers
- View real-time availability
- Calculate total amount before payment

### 2. **Payment Integration**
- Razorpay payment gateway integration
- Secure payment processing
- Payment verification and order management
- Automatic registration upon successful payment

### 3. **Registration Flow**
- **Free Events**: Direct registration
- **Paid Events**: Ticket selection → Payment → Registration
- Registration success confirmation
- Updated event capacity tracking

## Setup Instructions

### 1. **Razorpay Account Setup**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Get your Test API Keys:
   - Key ID (starts with `rzp_test_`)
   - Key Secret
3. Update the `.env` file in the server directory:
   ```env
   RAZORPAY_API_KEY=rzp_test_your_actual_key_id
   RAZORPAY_API_SECRET=your_actual_key_secret
   ```

### 2. **Database Schema Updates**
The Event model now includes payment tracking fields in the attendees schema:
- `paymentId`: Razorpay payment ID
- `orderId`: Razorpay order ID  
- `totalAmount`: Total amount paid

### 3. **API Endpoints Added**
- `GET /api/payments/key` - Get Razorpay public key
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment and complete registration

## User Flow

### For Free Events:
1. User clicks "Register" button
2. Direct registration (same as before)
3. Success confirmation

### For Paid Events:
1. User clicks "Register" button
2. **Ticket Selection Modal** opens
   - Shows available ticket types with prices
   - User selects quantities
   - Displays total amount
3. User clicks "Proceed to Payment"
4. **Payment Modal** opens
   - Shows order summary
   - Integrates with Razorpay checkout
   - Handles payment processing
5. After successful payment:
   - Payment verification on backend
   - User registration completed
   - **Success Modal** shows confirmation
   - Event capacity updated

## Technical Implementation

### Frontend Components:
- `TicketSelectionModal.jsx` - Ticket type and quantity selection
- `PaymentModal.jsx` - Razorpay payment integration  
- `RegistrationSuccessModal.jsx` - Success confirmation
- Updated `EventDetailPage.jsx` - Orchestrates the flow

### Backend Components:
- `paymentController.js` - Payment order creation and verification
- `paymentRoutes.js` - Payment API endpoints
- Updated `Event.js` model - Payment tracking fields

### Security Features:
- Payment signature verification
- Secure order creation
- Token-based authentication
- Input validation and sanitization

## Testing

### Test Payment Flow:
1. Create a paid event with ticket tiers
2. Navigate to event detail page
3. Click "Register" button
4. Select tickets in modal
5. Proceed to payment
6. Use Razorpay test card details:
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

### Test Cards for Different Scenarios:
- **Successful Payment**: 4111 1111 1111 1111
- **Failed Payment**: 4000 0000 0000 0002
- **Insufficient Funds**: 4000 0000 0000 9995

## Error Handling
- Network failures gracefully handled
- Payment verification failures
- Ticket availability checks
- User feedback via toast notifications

## Next Steps / Enhancements
1. **Ticket Download**: PDF ticket generation
2. **Refund System**: Cancellation and refund processing
3. **Multi-ticket Types**: Support for selecting multiple ticket types in single order
4. **Coupons/Discounts**: Promotional code system
5. **Email Notifications**: Payment confirmation emails
6. **Analytics**: Payment and revenue tracking

## Environment Variables Required

```env
# In server/.env
RAZORPAY_API_KEY=rzp_test_your_key_id
RAZORPAY_API_SECRET=your_key_secret

# In client/.env  
VITE_API_URL=http://localhost:5000
```

## Dependencies Added
- **Server**: `razorpay` package
- **Client**: Razorpay checkout script (loaded dynamically)

The payment integration is now fully functional and ready for testing with Razorpay test credentials!
