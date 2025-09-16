// import React, { useState, useEffect } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import { Toaster } from "react-hot-toast";
// import { AuthProvider } from "./contexts/AuthContext";
// import ProtectedRoute from "./components/ProtectedRoute";
// import PublicRoute from "./components/PublicRoute";
// import HashLoader from "react-spinners/HashLoader";

// // Pages
// import HomePage from "./pages/HomePage";
// import SignupPage from "./pages/SignupPage";
// import LoginPage from "./pages/LoginPage";
// import VerifyEmailPage from "./pages/VerifyEmailPage";
// import CompleteProfilePage from "./pages/CompleteProfilePage";
// import DashboardPage from "./pages/DashboardPage";
// import ProfilePage from "./pages/ProfilePage";
// import EventManagerDashboard from "./pages/EventManagerDashboard";

// // Venue Pages
// import AddVenuePage from "./pages/AddVenuePage";
// import MyVenuesPage from "./pages/MyVenuesPage";
// import VenueDetailPage from "./pages/VenueDetailPage";

// // Event Pages
// import AddEventPage from "./pages/AddEventPage";
// import EditEventPage from "./pages/EditEventPage";
// import MyEventsPage from "./pages/MyEventsPage";
// import EventDetailPage from "./pages/EventDetailPage";
// import EventsPage from "./pages/EventsPage";
// import LikedEventsPage from "./pages/LikedEventsPage";
// import FastFindPage from "./pages/FastFindPage";

// // Components
// import MyTickets from "./components/MyTickets";

// // Admin Pages
// import AdminVenuesPage from "./pages/AdminVenuesPage";
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import AdminVenueApproval from "./pages/admin/AdminVenueApproval";
// import AdminUserManagement from "./pages/admin/AdminUserManagement";
// import AdminEventManagement from "./pages/admin/AdminEventManagement";
// import VenueImageViewer from "./pages/admin/VenueImageViewer";

// function App() {
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Simulate initial loading (e.g., API call, auth check)
//     const timer = setTimeout(() => setLoading(false), 2000);
//     return () => clearTimeout(timer);
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-screen bg-gray-900">
//         <HashLoader color="#36d7b7" size={80} />
//       </div>
//     );
//   }

//   return (
//     <AuthProvider>
//       <Router>
//         <div className="App">
//           <Toaster
//             position="top-right"
//             toastOptions={{
//               duration: 4000,
//               style: { background: "#363636", color: "#fff" },
//               success: { duration: 3000, theme: { primary: "green", secondary: "black" } },
//             }}
//           />

//           <Routes>
//             {/* Public Routes */}
//             <Route path="/" element={<HomePage />} />

//             {/* Auth Routes */}
//             <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
//             <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
//             <Route path="/verify-email" element={<VerifyEmailPage />} />

//             {/* Protected Routes */}
//             <Route path="/complete-profile" element={<ProtectedRoute requireProfileCompletion={false}><CompleteProfilePage /></ProtectedRoute>} />
//             <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
//             <Route path="/profile" element={<ProtectedRoute requireProfileCompletion={false}><ProfilePage /></ProtectedRoute>} />
//             <Route path="/events-display" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
//             <Route path="/liked-events" element={<ProtectedRoute><LikedEventsPage /></ProtectedRoute>} />
//             <Route path="/fast-find" element={<ProtectedRoute><FastFindPage /></ProtectedRoute>} />
//             <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />

//             {/* Venue Management */}
//             <Route path="/add-venue" element={<ProtectedRoute requiredUserType="event_manager"><AddVenuePage /></ProtectedRoute>} />
//             <Route path="/event-manager/dashboard" element={<ProtectedRoute requiredUserType="event_manager"><EventManagerDashboard /></ProtectedRoute>} />
//             <Route path="/venues/manage" element={<ProtectedRoute requiredUserType="event_manager"><MyVenuesPage /></ProtectedRoute>} />
//             <Route path="/venues/:id" element={<ProtectedRoute><VenueDetailPage /></ProtectedRoute>} />

//             {/* Event Management */}
//             <Route path="/add-event" element={<ProtectedRoute requiredUserType="event_manager"><AddEventPage /></ProtectedRoute>} />
//             <Route path="/edit-event/:id" element={<ProtectedRoute requiredUserType="event_manager"><EditEventPage /></ProtectedRoute>} />
//             <Route path="/my-events" element={<ProtectedRoute requiredUserType="event_manager"><MyEventsPage /></ProtectedRoute>} />
//             <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />

//             {/* Admin Routes */}
//             <Route path="/admin" element={<ProtectedRoute requiredUserType="admin"><AdminDashboard /></ProtectedRoute>} />
//             <Route path="/admin/venues" element={<ProtectedRoute requiredUserType="admin"><AdminVenuesPage /></ProtectedRoute>} />
//             <Route path="/admin/venue-approval" element={<ProtectedRoute requiredUserType="admin"><AdminVenueApproval /></ProtectedRoute>} />
//             <Route path="/admin/users" element={<ProtectedRoute requiredUserType="admin"><AdminUserManagement /></ProtectedRoute>} />
//             <Route path="/admin/events" element={<ProtectedRoute requiredUserType="admin"><AdminEventManagement /></ProtectedRoute>} />
//             <Route path="/admin/venue-image" element={<ProtectedRoute requiredUserType="admin"><VenueImageViewer /></ProtectedRoute>} />

//             {/* Fallback */}
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import HashLoader from "react-spinners/HashLoader";

// Pages
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import CompleteProfilePage from "./pages/CompleteProfilePage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import EventManagerDashboard from "./pages/EventManagerDashboard";

// Venue Pages
import AddVenuePage from "./pages/AddVenuePage";
import MyVenuesPage from "./pages/MyVenuesPage";
import VenueDetailPage from "./pages/VenueDetailPage";

// Event Pages
import AddEventPage from "./pages/AddEventPage";
import EditEventPage from "./pages/EditEventPage";
import MyEventsPage from "./pages/MyEventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsPage from "./pages/EventsPage";
import LikedEventsPage from "./pages/LikedEventsPage";
import FastFindPage from "./pages/FastFindPage";

// Components
import MyTickets from "./components/MyTickets";

// Admin Pages
import AdminVenuesPage from "./pages/AdminVenuesPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVenueApproval from "./pages/admin/AdminVenueApproval";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminEventManagement from "./pages/admin/AdminEventManagement";
import VenueImageViewer from "./pages/admin/VenueImageViewer";

function AppContent() {
  const { loadingAuth, backendHealthy, backendError, retryConnection } = useAuth();

  // Show loading while checking backend and auth
  if (loadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900">
        <HashLoader color="#36d7b7" size={80} />
        <p className="text-white mt-4">Connecting to server...</p>
      </div>
    );
  }

  // Show error state if backend is not healthy
  if (!backendHealthy && backendError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <svg 
              className="mx-auto h-16 w-16 text-red-500 mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <h2 className="text-2xl font-bold text-red-500 mb-2">Connection Failed</h2>
            <p className="text-gray-300 mb-4">
              Unable to connect to the server. Please check your internet connection or try again later.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Error: {backendError}
            </p>
          </div>
          
          <button
            onClick={retryConnection}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // If backend is healthy, render your normal app routes
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />

      {/* Auth Routes */}
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected Routes */}
      <Route path="/complete-profile" element={<ProtectedRoute requireProfileCompletion={false}><CompleteProfilePage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requireProfileCompletion={false}><ProfilePage /></ProtectedRoute>} />
      <Route path="/events-display" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/liked-events" element={<ProtectedRoute><LikedEventsPage /></ProtectedRoute>} />
      <Route path="/fast-find" element={<ProtectedRoute><FastFindPage /></ProtectedRoute>} />
      <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />

      {/* Venue Management */}
      <Route path="/add-venue" element={<ProtectedRoute requiredUserType="event_manager"><AddVenuePage /></ProtectedRoute>} />
      <Route path="/event-manager/dashboard" element={<ProtectedRoute requiredUserType="event_manager"><EventManagerDashboard /></ProtectedRoute>} />
      <Route path="/venues/manage" element={<ProtectedRoute requiredUserType="event_manager"><MyVenuesPage /></ProtectedRoute>} />
      <Route path="/venues/:id" element={<ProtectedRoute><VenueDetailPage /></ProtectedRoute>} />

      {/* Event Management */}
      <Route path="/add-event" element={<ProtectedRoute requiredUserType="event_manager"><AddEventPage /></ProtectedRoute>} />
      <Route path="/edit-event/:id" element={<ProtectedRoute requiredUserType="event_manager"><EditEventPage /></ProtectedRoute>} />
      <Route path="/my-events" element={<ProtectedRoute requiredUserType="event_manager"><MyEventsPage /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requiredUserType="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/venues" element={<ProtectedRoute requiredUserType="admin"><AdminVenuesPage /></ProtectedRoute>} />
      <Route path="/admin/venue-approval" element={<ProtectedRoute requiredUserType="admin"><AdminVenueApproval /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredUserType="admin"><AdminUserManagement /></ProtectedRoute>} />
      <Route path="/admin/events" element={<ProtectedRoute requiredUserType="admin"><AdminEventManagement /></ProtectedRoute>} />
      <Route path="/admin/venue-image" element={<ProtectedRoute requiredUserType="admin"><VenueImageViewer /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#363636", color: "#fff" },
              success: { duration: 3000, theme: { primary: "green", secondary: "black" } },
            }}
          />
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}
