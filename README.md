# 🎯 Spotlight - Event Management Platform

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-success.svg)](https://mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.12-38B2AC.svg)](https://tailwindcss.com/)

A modern, full-stack event management platform that connects event organizers with attendees, featuring real-time payments, venue management, and comprehensive financial tracking.

## 🌟 Features

### 👥 User Management
- **Multi-role Authentication**: Regular users, Event Managers, and Admins
- **Profile Management**: Complete profile setup with location-based preferences
- **Location-based Discovery**: Find events within customizable radius
- **Interest-based Recommendations**: Personalized event suggestions

### 🎪 Event Management
- **Event Creation & Management**: Rich event creation with images, pricing, and venue selection
- **Real-time Registration**: Instant event registration for free events
- **Payment Integration**: Razorpay integration for paid events with ticket selection
- **Event Status Tracking**: Upcoming, ongoing, completed, cancelled, and postponed events
- **Review System**: Post-event reviews and ratings

### 🏢 Venue Management
- **Venue Registration**: Event managers can add and manage venues
- **Admin Approval System**: Venue verification and approval workflow
- **Capacity Management**: Automated capacity tracking and event-full notifications
- **Location Integration**: Geocoding and map-based venue discovery

### 💰 Financial Management
- **Revenue Tracking**: Comprehensive financial dashboard for event managers
- **Withdrawal System**: Multiple withdrawal methods (Bank transfer, UPI, Digital wallet)
- **Transaction History**: Detailed financial reporting and analytics
- **Bank Details Management**: Secure banking information storage

### 🎫 Ticketing System
- **Digital Tickets**: QR code-based ticket generation
- **PDF Generation**: Downloadable ticket PDFs with event details
- **Multiple Ticket Types**: Support for different pricing tiers
- **Registration Management**: Track attendees and registration status

### 📱 User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Fast Find**: Quick event discovery feature
- **Real-time Notifications**: Toast notifications for user actions
- **Sticky Navigation**: Always-accessible navigation bar
- **Interactive UI**: Modern, intuitive interface with smooth animations

## 🛠 Tech Stack

### Frontend
- **React 19.1.1** - Modern React with hooks and context
- **Vite** - Lightning-fast build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS 4.1.12** - Utility-first CSS framework
- **Lucide React** - Beautiful SVG icon library
- **React Hook Form** - Performant forms with easy validation
- **Yup** - Schema validation
- **Axios** - HTTP client for API communication
- **React Hot Toast** - Elegant toast notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js 5.1.0** - Fast, unopinionated web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Razorpay** - Payment gateway integration
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation for tickets
- **QRCode** - QR code generation
- **Helmet** - Security middleware
- **Express Rate Limit** - Rate limiting middleware

### Development Tools
- **Concurrently** - Run client and server simultaneously
- **Nodemon** - Auto-restart server on changes
- **ESLint** - Code linting and formatting
- **Cloudinary** - Image upload and management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Razorpay account for payments

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KRISHNA-JAIN15/SpotLight.git
   cd spotlight
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   cd ..
   ```

3. **Environment Setup**
   
   Create `.env` file in the server directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/spotlight
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   
   # Razorpay Configuration
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Email Configuration (optional)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Start the application**
   ```bash
   # From root directory - starts both client and server
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Terminal 1 - Server
   cd server
   npm run dev
   
   # Terminal 2 - Client
   cd client
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 📖 Usage Guide

### For Regular Users
1. **Sign Up/Login** - Create account or login
2. **Complete Profile** - Add location and interests
3. **Discover Events** - Browse events in your area
4. **Register for Events** - Free events: instant registration, Paid events: payment flow
5. **Manage Tickets** - Download and view your event tickets
6. **Review Events** - Rate and review attended events

### For Event Managers
1. **Create Account** - Sign up as Event Manager
2. **Add Venues** - Register venues for approval
3. **Create Events** - Set up events with pricing and details
4. **Track Revenue** - Monitor earnings and withdrawals
5. **Manage Events** - Edit, cancel, or postpone events
6. **Financial Management** - Request withdrawals and manage bank details

### For Administrators
1. **Admin Dashboard** - Overview of platform activity
2. **Venue Approval** - Review and approve venue registrations
3. **User Management** - Monitor and manage user accounts
4. **System Oversight** - Platform maintenance and monitoring

## 🏗 Project Structure

```
spotlight/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   └── utils/            # Backend utilities
└── docs/                 # Documentation
```

## 🔧 Key Components

### Frontend Components
- **Navbar**: Sticky navigation with user-specific menus
- **EventCard**: Reusable event display component
- **FinancialProfile**: Event manager financial dashboard
- **TicketModal**: Payment and ticket selection interface
- **ReviewSystem**: Event rating and review functionality

### Backend Models
- **User**: User authentication and profile management
- **Event**: Event creation and management
- **Venue**: Venue registration and approval
- **Registration**: Event registration tracking
- **Payment**: Financial transaction management

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway)
```bash
cd server
# Set environment variables
# Deploy with your preferred platform
```

### Database (MongoDB Atlas)
- Create MongoDB Atlas cluster
- Update connection string in environment variables
- Set up database indexes for performance

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: Prevent API abuse
- **Helmet**: Security headers protection
- **CORS**: Cross-origin resource sharing configuration

## 🎨 Design System

### Colors
- **Primary**: Blue (#3B82F6) to Purple (#8B5CF6) gradient
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale (#6B7280, #9CA3AF, #D1D5DB)

### Typography
- **Font**: System font stack with Tailwind CSS defaults
- **Scale**: Responsive typography using Tailwind's text utilities

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Events
- `GET /api/events` - List events with filters
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/register` - Register for event
- `GET /api/events/:id/registration-status` - Check registration status

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

### Venues
- `GET /api/venues` - List venues
- `POST /api/venues` - Create venue
- `PUT /api/admin/venues/:id/approve` - Approve venue

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Krishna Jain**
- GitHub: [@KRISHNA-JAIN15](https://github.com/KRISHNA-JAIN15)

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Lucide React for beautiful icons
- All open-source contributors

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

⭐ **Star this repository if it helped you!**