import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import EventForm from "../components/events/EventForm";

const EditEventPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  // Redirect if not authenticated or not event manager
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.type !== "event_manager") {
      toast.error("Access denied. Event managers only.");
      navigate("/");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch event data for editing
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/events/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          const event = response.data.data;

          // Check if current user is the organizer
          if (event.organizer !== user.id && event.organizer._id !== user.id) {
            toast.error("You can only edit your own events.");
            navigate("/my-events");
            return;
          }

          setEventData(event);
        } else {
          toast.error("Failed to fetch event data");
          navigate("/my-events");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast.error("Failed to fetch event data");
        navigate("/my-events");
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchEventData();
    }
  }, [id, user, navigate]);

  const handleSubmit = async (updatedEventData) => {
    try {
      console.log("Updated event data:", updatedEventData);
      console.log("Date time object:", updatedEventData.dateTime);
      setIsLoading(true);

      // The EventForm now sends the data in the correct structure
      // Just add timezone to the dateTime object
      const transformedData = {
        ...updatedEventData,
        dateTime: {
          ...updatedEventData.dateTime,
          timezone: "Asia/Kolkata",
        },
        tags: updatedEventData.tags || [],
        images: updatedEventData.images || [],
        contactInfo: {
          email: updatedEventData.contactEmail,
          phone: updatedEventData.contactPhone,
        },
        visibility: "public",
      };

      console.log("Transformed update data:", transformedData);

      // Send update request
      const response = await axios.put(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/${id}`,
        transformedData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Update response:", response.data);
      toast.success("Event updated successfully!");
      navigate("/my-events");
    } catch (error) {
      console.error("Error updating event:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      console.error("Validation errors:", error.response?.data?.errors);

      // Handle validation errors
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err) => `${err.path}: ${err.msg}`)
          .join(", ");
        toast.error(`Validation errors: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to update event. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading event data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">Event not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="mt-2 text-gray-600">
            Update your event details below. All fields marked with * are
            required.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <EventForm
            onSubmit={handleSubmit}
            initialData={eventData}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;
