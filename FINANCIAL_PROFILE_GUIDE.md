# Financial Profile System - Implementation Guide

## Overview
The Financial Profile system enables event managers to track their earnings, manage withdrawals, and view financial analytics. The system implements a 75/25 revenue split where event managers receive 75% of ticket sales and the admin receives 25%.

## Backend Implementation

### 1. User Model Enhancement (`server/models/User.js`)
Added `financialProfile` schema to the User model with:
- `totalEarnings`: Calculated field (not stored directly)
- `totalWithdrawals`: Sum of all successful withdrawals
- `availableBalance`: Calculated field (earnings - withdrawals)
- `withdrawalHistory`: Array of withdrawal transactions
- `bankDetails`: Bank account information for withdrawals

### 2. Revenue Controller (`server/controllers/revenueController.js`)
Added three new functions:

#### `getFinancialProfile`
- Calculates real-time earnings from completed events (75% of ticket sales)
- Returns current balance, total withdrawals, and transaction history
- Formula: `earnings = completedEvents.reduce(ticketSales * ticketPrice * 0.75)`

#### `requestWithdrawal`
- Validates withdrawal amount against available balance
- Creates mock transaction with unique transaction ID
- Updates user's withdrawal history and total withdrawals
- Returns transaction details for confirmation

#### `updateBankDetails`
- Securely stores bank account information
- Validates required fields (account number, IFSC, bank name, account holder)
- Updates user's bank details for future withdrawals

### 3. Revenue Routes (`server/routes/revenueRoutes.js`)
Added protected routes:
- `GET /api/revenue/financial-profile` - Get financial overview
- `POST /api/revenue/withdraw` - Process withdrawal request
- `PUT /api/revenue/bank-details` - Update bank account details

## Frontend Implementation

### 1. Financial Profile Component (`client/src/components/FinancialProfile.jsx`)
React component featuring:

#### Financial Overview Cards
- **Total Earnings**: Shows cumulative earnings with 75% revenue share note
- **Available Balance**: Current withdrawable amount
- **Total Withdrawals**: Sum of all completed withdrawals

#### Withdrawal System
- Modal-based withdrawal request form
- Real-time balance validation
- Multiple withdrawal methods (Bank Transfer, UPI, Digital Wallet)
- Optional transaction notes

#### Bank Details Management
- Secure bank account form (Account Number, IFSC, Bank Name, Account Holder)
- Integration with withdrawal system
- Masked account display for security

#### Transaction History
- Tabular display of all withdrawal transactions
- Shows date, amount, method, transaction ID, and status
- Status indicators (completed, pending, failed)

### 2. Profile Page Integration (`client/src/pages/ProfilePage.jsx`)
- Conditionally displays Financial Profile for event managers (`user.type === "event_manager"`)
- Positioned as a prominent section before other profile information
- Seamless integration with existing profile layout

## Key Features

### 1. Real-time Earnings Calculation
- Earnings are calculated dynamically from event ticket sales
- Only includes completed events to ensure accurate revenue
- Applies 75% revenue share automatically

### 2. Mock Withdrawal System
- Simulates real withdrawal processing with transaction IDs
- Tracks withdrawal status and history
- Validates sufficient balance before processing

### 3. Security Features
- Protected API routes with authentication middleware
- Bank details stored securely
- Account number masking in UI display
- Input validation for all financial operations

### 4. User Experience
- Intuitive modal-based forms
- Real-time balance updates
- Clear transaction history
- Responsive design for all screen sizes

## Usage Instructions

### For Event Managers:
1. Navigate to Profile page
2. Financial Profile section appears automatically for event managers
3. View current earnings and available balance
4. Click "Bank Details" to add/update bank information
5. Click "Withdraw" to request a withdrawal
6. Fill withdrawal amount and select method
7. View transaction history in the bottom table

### For Administrators:
1. Revenue analytics show 25% admin share
2. All withdrawal requests are logged for audit
3. Financial profiles can be monitored through admin dashboard

## API Testing

### Test Financial Profile Endpoint
```bash
GET /api/revenue/financial-profile
Authorization: Bearer <event_manager_token>
```

### Test Withdrawal Request
```bash
POST /api/revenue/withdraw
Authorization: Bearer <event_manager_token>
Content-Type: application/json

{
  "amount": 1000,
  "method": "bank_transfer",
  "note": "Monthly withdrawal"
}
```

### Test Bank Details Update
```bash
PUT /api/revenue/bank-details
Authorization: Bearer <event_manager_token>
Content-Type: application/json

{
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "bankName": "State Bank of India",
  "accountHolderName": "John Doe"
}
```

## Revenue Calculation Formula

For each completed event:
```javascript
const eventRevenue = event.attendees.length * event.ticketPrice;
const managerEarnings = eventRevenue * 0.75; // 75% to manager
const adminEarnings = eventRevenue * 0.25;   // 25% to admin
```

Total Manager Earnings:
```javascript
const totalEarnings = completedEvents.reduce((total, event) => {
  return total + (event.attendees.length * event.ticketPrice * 0.75);
}, 0);
```

Available Balance:
```javascript
const availableBalance = totalEarnings - totalWithdrawals;
```

## Next Steps for Production

1. **Real Payment Integration**: Replace mock withdrawal system with actual payment gateway
2. **Bank Verification**: Implement bank account verification before withdrawals
3. **Withdrawal Limits**: Add daily/monthly withdrawal limits
4. **Tax Calculations**: Include tax deductions and reporting
5. **Audit Trails**: Enhanced logging for financial transactions
6. **Multi-currency Support**: Support for different currencies
7. **Automated Transfers**: Schedule automatic payouts to event managers

## Files Modified/Created

### Backend:
- `server/models/User.js` - Added financialProfile schema
- `server/controllers/revenueController.js` - Added financial functions
- `server/routes/revenueRoutes.js` - Added new routes

### Frontend:
- `client/src/components/FinancialProfile.jsx` - New component
- `client/src/pages/ProfilePage.jsx` - Integrated financial profile

### Routes Added:
- `GET /api/revenue/financial-profile`
- `POST /api/revenue/withdraw`
- `PUT /api/revenue/bank-details`

The system is now fully functional and ready for testing with event managers who have completed events with ticket sales.