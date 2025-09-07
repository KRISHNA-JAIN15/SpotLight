import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import VenueForm from "../components/venues/VenueForm";
import Navbar from "../components/Navbar";

const AddVenuePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not an event manager
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.type !== "event_manager") {
      toast.error("Only event managers can add venues");
      navigate("/");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (venueData) => {
    try {
      setIsLoading(true);

      console.log("Submitting venue data:", venueData);

      // Make API call to create venue
      const response = await fetch("/api/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(venueData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create venue");
      }

      toast.success(
        "Venue submitted successfully! It will be reviewed by our team before being published."
      );
      navigate("/venues");
    } catch (error) {
      console.error("Error creating venue:", error);
      toast.error(error.message || "Failed to create venue");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || user?.type !== "event_manager") {
    return null; // Don't render anything while redirecting
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto">
          <VenueForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
};

export default AddVenuePage;
