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
  const { loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <HashLoader color="#36d7b7" size={80} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/complete-profile" element={<ProtectedRoute requireProfileCompletion={false}><CompleteProfilePage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute requireProfileCompletion={false}><ProfilePage /></ProtectedRoute>} />
      <Route path="/events-display" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/liked-events" element={<ProtectedRoute><LikedEventsPage /></ProtectedRoute>} />
      <Route path="/fast-find" element={<ProtectedRoute><FastFindPage /></ProtectedRoute>} />
      <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
      <Route path="/add-venue" element={<ProtectedRoute requiredUserType="event_manager"><AddVenuePage /></ProtectedRoute>} />
      <Route path="/event-manager/dashboard" element={<ProtectedRoute requiredUserType="event_manager"><EventManagerDashboard /></ProtectedRoute>} />
      <Route path="/venues/manage" element={<ProtectedRoute requiredUserType="event_manager"><MyVenuesPage /></ProtectedRoute>} />
      <Route path="/venues/:id" element={<ProtectedRoute><VenueDetailPage /></ProtectedRoute>} />
      <Route path="/add-event" element={<ProtectedRoute requiredUserType="event_manager"><AddEventPage /></ProtectedRoute>} />
      <Route path="/edit-event/:id" element={<ProtectedRoute requiredUserType="event_manager"><EditEventPage /></ProtectedRoute>} />
      <Route path="/my-events" element={<ProtectedRoute requiredUserType="event_manager"><MyEventsPage /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requiredUserType="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/venues" element={<ProtectedRoute requiredUserType="admin"><AdminVenuesPage /></ProtectedRoute>} />
      <Route path="/admin/venue-approval" element={<ProtectedRoute requiredUserType="admin"><AdminVenueApproval /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredUserType="admin"><AdminUserManagement /></ProtectedRoute>} />
      <Route path="/admin/events" element={<ProtectedRoute requiredUserType="admin"><AdminEventManagement /></ProtectedRoute>} />
      <Route path="/admin/venue-image" element={<ProtectedRoute requiredUserType="admin"><VenueImageViewer /></ProtectedRoute>} />
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
