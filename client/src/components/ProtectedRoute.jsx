import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({
  children,
  requireProfileCompletion = true, // Default to true for most protected routes
  requiredUserType = null,
}) => {
  const {
    isAuthenticated,
    user,
    requiresVerification,
    requiresProfileCompletion,
  } = useAuth();
  const location = useLocation();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Email not verified - redirect to verify email page
  if (requiresVerification || !user?.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Profile not completed and route requires it - redirect to profile completion
  // Don't redirect if user is already on the complete-profile page
  if (
    requireProfileCompletion &&
    (requiresProfileCompletion || !user?.isProfileCompleted) &&
    location.pathname !== "/complete-profile"
  ) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Role-based access control
  if (requiredUserType && user?.type !== requiredUserType) {
    // Redirect to appropriate dashboard based on user type
    if (user?.type === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user?.type === "event_manager") {
      return <Navigate to="/event-manager/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
