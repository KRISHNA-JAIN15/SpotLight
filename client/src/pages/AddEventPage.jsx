import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import EventForm from "../components/events/EventForm";

const AddEventPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmit = async (eventData) => {
    try {
      console.log("Event data received in AddEventPage:", eventData);
      setIsLoading(true);

      // Validate dates before processing
      // Access dates from the dateTime object where they're actually stored
      const startDate = eventData.dateTime?.startDate
        ? new Date(eventData.dateTime.startDate)
        : null;
      const endDate = eventData.dateTime?.endDate
        ? new Date(eventData.dateTime.endDate)
        : null;

      console.log("Event data dateTime:", eventData.dateTime);
      console.log("Raw startDate:", eventData.dateTime?.startDate);
      console.log("Raw endDate:", eventData.dateTime?.endDate);
      console.log("Parsed startDate:", startDate);
      console.log("Parsed endDate:", endDate);

      if (!startDate || isNaN(startDate.getTime())) {
        throw new Error(
          "Invalid start date. Please provide a valid start date."
        );
      }

      if (!endDate || isNaN(endDate.getTime())) {
        throw new Error("Invalid end date. Please provide a valid end date.");
      }

      if (startDate >= endDate) {
        throw new Error("End date must be after start date.");
      }

      // Transform the data to match the backend validation and schema
      const transformedData = {
        title: eventData.title,
        description: eventData.description,
        category: eventData.category,
        type: eventData.type,
        venue: eventData.venue,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        maxAttendees: parseInt(eventData.maxAttendees),
        dateTime: {
          startDate: startDate,
          endDate: endDate,
          timezone: "Asia/Kolkata",
        },
        pricing: {
          isFree: eventData.type === "free",
          totalCapacity: parseInt(eventData.maxAttendees),
          availableTickets: parseInt(eventData.maxAttendees),
          tickets:
            eventData.type === "paid"
              ? [
                  ...(eventData.pricing.general > 0
                    ? [
                        {
                          type: "general",
                          price: parseFloat(eventData.pricing.general),
                          currency: "INR",
                          quantity: {
                            total: Math.floor(
                              parseInt(eventData.maxAttendees) * 0.7
                            ), // 70% general
                            available: Math.floor(
                              parseInt(eventData.maxAttendees) * 0.7
                            ),
                            sold: 0,
                          },
                        },
                      ]
                    : []),
                  ...(eventData.pricing.vip > 0
                    ? [
                        {
                          type: "vip",
                          price: parseFloat(eventData.pricing.vip),
                          currency: "INR",
                          quantity: {
                            total: Math.floor(
                              parseInt(eventData.maxAttendees) * 0.2
                            ), // 20% VIP
                            available: Math.floor(
                              parseInt(eventData.maxAttendees) * 0.2
                            ),
                            sold: 0,
                          },
                        },
                      ]
                    : []),
                  ...(eventData.pricing.premium > 0
                    ? [
                        {
                          type: "premium",
                          price: parseFloat(eventData.pricing.premium),
                          currency: "INR",
                          quantity: {
                            total: Math.floor(
                              parseInt(eventData.maxAttendees) * 0.1
                            ), // 10% premium
                            available: Math.floor(
                              parseInt(eventData.maxAttendees) * 0.1
                            ),
                            sold: 0,
                          },
                        },
                      ]
                    : []),
                ]
              : [],
          general: eventData.pricing?.general || 0,
          vip: eventData.pricing?.vip || 0,
          premium: eventData.pricing?.premium || 0,
        },
        tags: eventData.tags || [],
        images: eventData.images || [], // Add images array
        contactInfo: {
          email: eventData.contactEmail,
          phone: eventData.contactPhone,
        },
        contactEmail: eventData.contactEmail,
        contactPhone: eventData.contactPhone,
        visibility: "public",
        status: "upcoming",
      };

      console.log("Transformed data:", transformedData);

      // Send as JSON data with images URLs from Cloudinary
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/events`,
        transformedData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Event created successfully!");
      navigate("/my-events");
    } catch (error) {
      console.error("Error creating event:", error);

      if (error.message && error.message.includes("Invalid")) {
        // Handle date validation errors
        toast.error(error.message);
      } else if (error.response) {
        console.error("Error response:", error.response);
        console.error("Error data:", error.response?.data);
        console.error("Validation errors:", error.response?.data?.errors);

        // Handle validation errors
        if (error.response?.data?.errors) {
          const errorMessages = error.response.data.errors
            .map((err) => err.msg)
            .join(", ");
          toast.error(`Validation Error: ${errorMessages}`);
        } else {
          toast.error(
            error.response?.data?.message || "Failed to create event"
          );
        }
      } else {
        toast.error("Network error or server unavailable");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || user?.type !== "event_manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8">
        <div className="max-w-4xl mx-auto">
          <EventForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default AddEventPage;
