import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  // If user is authenticated, redirect based on user type
  if (isAuthenticated) {
    if (user?.type === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user?.type === "event_manager") {
      return <Navigate to="/my-venues" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If not authenticated, show the public page
  return children;
};

export default PublicRoute;
