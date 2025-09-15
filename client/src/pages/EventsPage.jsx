import React, { useState, useEffect } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Filter,
  Heart,
  DollarSign,
  Navigation,
  AlertCircle,
  UserPlus,
  UserCheck,
  PlayCircle,
  PauseCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import api from "../services/api";

const EventsPage = () => {
  const { user, isAuthenticated, requiresProfileCompletion } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [likedEventIds, setLikedEventIds] = useState(new Set());

  useEffect(() => {
    const getUserLocationAndFetchLiked = async () => {
      getUserLocation();
      fetchLikedEventIds();
    };
    getUserLocationAndFetchLiked();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userLocation) {
      fetchEvents();
    }
  }, [userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userLocation) {
      fetchEvents();
    }
  }, [selectedCategory, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (events.length > 0) {
      fetchRegistrationStatuses();
    }
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if not authenticated or profile not completed
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresProfileCompletion || !user?.isProfileCompleted) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Role-based redirects
  if (user?.type === "admin") {
    return <Navigate to="/admin/venues" replace />;
  }

  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    // Use stored user coordinates from profile instead of real-time location
    if (user?.location?.coordinates && user.location.coordinates.length === 2) {
      const [longitude, latitude] = user.location.coordinates;
      setUserLocation({
        latitude: latitude,
        longitude: longitude,
      });
      setLocationLoading(false);
      setLocationError(null);
    } else {
      setLocationError(
        "No location found in your profile. Please update your profile with your location to see nearby events."
      );
      setLocationLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      if (sortBy) {
        params.append("sort", sortBy);
      }

      if (userLocation) {
        params.append("latitude", userLocation.latitude);
        params.append("longitude", userLocation.longitude);
      }

      const response = await api.get(`/events?${params.toString()}`);

      if (response.success) {
        const eventsData = response.data.events || response.data;
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } else {
        setEvents([]);
      }

      if (response.data.length === 0) {
        setLocationError(
          "No events found in your preferred area. Try updating your location preferences in your profile."
        );
      } else {
        setLocationError(null);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setLocationError("Failed to fetch events. Please try again later.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedEventIds = async () => {
    try {
      const response = await api.get(`/events/my-liked`);

      if (response.success) {
        const likedData = Array.isArray(response.data) ? response.data : [];
        setLikedEventIds(new Set(likedData.map((event) => event._id)));
      }
    } catch (error) {
      console.error("Error fetching liked event IDs:", error);
    }
  };

  const fetchRegistrationStatuses = async () => {
    try {
      if (!Array.isArray(events) || events.length === 0) {
        return;
      }

      const statuses = {};
      await Promise.all(
        events.map(async (event) => {
          try {
            const response = await api.get(
              `/events/${event._id}/registration-status`
            );
            if (response.success) {
              statuses[event._id] = response.data;
            }
          } catch (error) {
            console.error(
              `Error fetching registration status for event ${event._id}:`,
              error
            );
          }
        })
      );
      setRegistrationStatus(statuses);
    } catch (error) {
      console.error("Error fetching registration statuses:", error);
    }
  };

  const handleRegisterForEvent = async (event) => {
    console.log("🎫 Registration clicked for event:", event.title);
    console.log("🔍 Event pricing:", event.pricing);
    console.log("💰 Event pricing isFree:", event.pricing?.isFree);
    console.log("🎟️ Event tickets:", event.pricing?.tickets);

    // Check if event is paid - redirect to event detail page for payment flow
    if (event.pricing && !event.pricing.isFree) {
      console.log(
        "💳 Event is paid, navigating to event detail page for payment"
      );
      navigate(`/events/${event._id}`);
      return;
    }

    // Check if event has tickets with prices > 0 (alternative check)
    if (event.pricing?.tickets && event.pricing.tickets.length > 0) {
      const hasPaidTickets = event.pricing.tickets.some(
        (ticket) => ticket.price > 0
      );
      if (hasPaidTickets) {
        console.log(
          "💳 Event has paid tickets, navigating to event detail page"
        );
        navigate(`/events/${event._id}`);
        return;
      }
    }

    try {
      console.log("✅ Attempting direct registration for free event");
      // For free events, try direct registration
      const response = await api.post(`/events/${event._id}/register`, {});
      console.log("📝 Registration response:", response);

      if (response.success) {
        toast.success("Successfully registered for the free event!");
        fetchRegistrationStatuses();
      } else {
        console.log("❌ Registration failed - response not successful");
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("❌ Registration error:", error);

      // The API interceptor returns the error response data directly
      // Check for requiresPayment flag in multiple possible locations
      const requiresPayment =
        error.requiresPayment ||
        error?.data?.requiresPayment ||
        error?.response?.data?.requiresPayment;

      if (requiresPayment) {
        console.log(
          "💳 Backend confirmed payment required, navigating to event detail page"
        );
        // Navigate to event detail page for payment
        navigate(`/events/${event._id}`);
      } else {
        const errorMessage =
          error.message ||
          error?.data?.message ||
          "Failed to register for event";
        toast.error(errorMessage);
      }
    }
  };

  const handleToggleLike = async (eventId) => {
    try {
      // Optimistic UI update
      const newLikedEventIds = new Set(likedEventIds);
      const wasLiked = newLikedEventIds.has(eventId);

      if (wasLiked) {
        newLikedEventIds.delete(eventId);
      } else {
        newLikedEventIds.add(eventId);
      }
      setLikedEventIds(newLikedEventIds);

      const response = await api.post(`/events/${eventId}/toggle-like`, {});

      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        // Revert optimistic update if request failed
        setLikedEventIds(likedEventIds);
      }
    } catch (error) {
      console.error("Toggle like error:", error);
      toast.error("Failed to update like status");
      // Revert optimistic update if request failed
      setLikedEventIds(likedEventIds);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventPrice = (event) => {
    if (event.pricing?.isFree) return "Free";
    if (event.pricing?.tickets && event.pricing.tickets.length > 0) {
      const minPrice = Math.min(...event.pricing.tickets.map((t) => t.price));
      return `₹${minPrice}`;
    }
    return "TBA";
  };

  const getStatusBadge = (status, event) => {
    // Calculate the actual status based on current time and event dates
    const now = new Date();
    const startDate = new Date(event.dateTime.startDate);
    const endDate = new Date(event.dateTime.endDate);

    let actualStatus = status;

    // Only recalculate if the stored status is not manually set (cancelled/postponed)
    if (status !== "cancelled" && status !== "postponed") {
      if (now < startDate) {
        actualStatus = "upcoming";
      } else if (now >= startDate && now <= endDate) {
        actualStatus = "ongoing";
      } else {
        actualStatus = "completed";
      }
    }

    const statusConfig = {
      upcoming: {
        color: "bg-blue-100 text-blue-800",
        icon: Calendar,
        text: "Upcoming",
      },
      ongoing: {
        color: "bg-green-100 text-green-800",
        icon: PlayCircle,
        text: "Ongoing",
      },
      completed: {
        color: "bg-gray-100 text-gray-800",
        icon: PauseCircle,
        text: "Completed",
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "Cancelled",
      },
      postponed: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "Postponed",
      },
    };

    const config = statusConfig[actualStatus] || statusConfig.upcoming;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const isEventFull = (event) => {
    if (!event?.pricing?.totalCapacity) return false;
    const attendeesCount = event.attendees?.length || 0;
    return attendeesCount >= event.pricing.totalCapacity;
  };

  const renderEventCard = (event) => {
    const isRegistered = registrationStatus[event._id]?.isRegistered;

    return (
      <div
        key={event._id}
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      >
        {/* Event Image */}
        <div className="relative h-48 bg-gray-200">
          {event.images && event.images.length > 0 ? (
            <img
              src={event.images[0].url || event.images[0]}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="flex items-center justify-center h-full"
            style={{
              display:
                event.images && event.images.length > 0 ? "none" : "flex",
            }}
          >
            <Calendar className="h-16 w-16 text-gray-400" />
          </div>
          <div className="absolute top-2 right-2">
            <button
              onClick={() => handleToggleLike(event._id)}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${
                  likedEventIds.has(event._id)
                    ? "text-red-500 fill-red-500"
                    : "text-gray-400 hover:text-red-400"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Event Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {event.title}
            </h3>
            <span className="text-sm font-medium text-green-600 ml-2">
              {getEventPrice(event)}
            </span>
          </div>

          {/* Status Badge */}
          <div className="mb-2">{getStatusBadge(event.status, event)}</div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {event.shortDescription || event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(event.dateTime.startDate)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-2" />
              {formatTime(event.dateTime.startDate)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="h-4 w-4 mr-2" />
              {event.venueDetails?.name || event.venue?.name},{" "}
              {event.venueDetails?.address?.city || event.venue?.city}
            </div>
            {event.attendees && (
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-2" />
                {event.attendees.length} attending
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {event.category}
            </div>

            <div className="flex items-center space-x-2">
              {!isRegistered && !isEventFull(event) && (
                <button
                  onClick={() => handleRegisterForEvent(event)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Register
                </button>
              )}

              {!isRegistered && isEventFull(event) && (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-md flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  Event Full
                </span>
              )}

              {isRegistered && (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-md flex items-center">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Registered
                </span>
              )}

              <Link
                to={`/events/${event._id}`}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Discover Events
              </h1>
              <p className="text-gray-600 mt-1">
                Find exciting events happening near you
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Status */}
        {locationLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Navigation className="h-5 w-5 text-blue-400 mr-2 animate-spin" />
              <span className="text-blue-800">
                Loading your saved location to show nearby events...
              </span>
            </div>
          </div>
        )}

        {userLocation && !locationLoading && !locationError && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Navigation className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-800">
                Showing events within {user?.preferences?.radius || 15}km of
                your location ({user?.location?.city || "your area"})
              </span>
            </div>
          </div>
        )}

        {locationError && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="text-yellow-800">{locationError}</span>
              </div>
              <Link
                to="/complete-profile"
                className="ml-4 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
              >
                Update Profile
              </Link>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="tech">Technology</option>
                  <option value="food">Food & Drink</option>
                  <option value="art">Arts & Culture</option>
                  <option value="business">Business</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="health">Health & Wellness</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="price">Sort by Price</option>
                <option value="popularity">Sort by Popularity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !Array.isArray(events) || events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600">
              {userLocation
                ? `No events found within ${
                    user?.preferences?.radius || 15
                  }km of your location.`
                : "Please update your location to see nearby events."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => renderEventCard(event))}
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;
