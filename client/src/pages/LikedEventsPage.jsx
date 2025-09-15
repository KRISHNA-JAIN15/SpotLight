import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Star,
  Filter,
  Heart,
  DollarSign,
  BookmarkIcon,
  UserPlus,
  UserCheck,
  PlayCircle,
  PauseCircle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import axios from "axios";

const LikedEventsPage = () => {
  const { user, isAuthenticated, requiresProfileCompletion } = useAuth();
  const [likedEvents, setLikedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState({});

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

  if (user?.type === "event_manager") {
    return <Navigate to="/event-manager/dashboard" replace />;
  }

  useEffect(() => {
    fetchLikedEvents();
  }, []);

  useEffect(() => {
    if (Array.isArray(likedEvents) && likedEvents.length > 0) {
      fetchRegistrationStatuses();
    }
  }, [likedEvents]);

  const fetchLikedEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/events/my-liked", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        setLikedEvents(
          Array.isArray(response.data.data) ? response.data.data : []
        );
      } else {
        setLikedEvents([]);
      }
    } catch (error) {
      console.error("Error fetching liked events:", error);
      toast.error("Failed to fetch liked events");
      setLikedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationStatuses = async () => {
    try {
      if (!Array.isArray(likedEvents) || likedEvents.length === 0) {
        return;
      }

      const statuses = {};
      await Promise.all(
        likedEvents.map(async (event) => {
          try {
            const response = await axios.get(
              `/events/${event._id}/registration-status`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );
            if (response.data.success) {
              statuses[event._id] = response.data.data;
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

  const handleRegisterForEvent = async (eventId) => {
    try {
      const response = await axios.post(
        `/events/${eventId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Successfully registered for event!");
        fetchRegistrationStatuses();
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message || "Failed to register for event"
      );
    }
  };

  const handleRemoveLike = async (eventId) => {
    try {
      const response = await axios.post(
        `/events/${eventId}/toggle-like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Event removed from liked events");
        // Refresh the liked events list
        fetchLikedEvents();
      }
    } catch (error) {
      console.error("Remove like error:", error);
      toast.error("Failed to remove from liked events");
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
              src={event.images[0].url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Calendar className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <button
              onClick={() => handleRemoveLike(event._id)}
              className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              title="Remove from liked events"
            >
              <Heart className="h-4 w-4 text-red-500 fill-current" />
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
              {event.venue?.name}, {event.venue?.city}
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
                  onClick={() => handleRegisterForEvent(event._id)}
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
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BookmarkIcon className="h-8 w-8 text-red-600 mr-3" />
                Liked Events
              </h1>
              <p className="text-gray-600 mt-1">
                Events you've bookmarked and liked
              </p>
            </div>
            {/* <div className="flex items-center space-x-3">
              <Link
                to="/events-display"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Browse Events
              </Link>
              <Link
                to="/fast-find"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Fast Find
              </Link>
            </div> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : !Array.isArray(likedEvents) || likedEvents.length === 0 ? (
          <div className="text-center py-12">
            <BookmarkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No liked events yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't liked any events yet. Start exploring and bookmark
              events you're interested in!
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/events-display"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Events
              </Link>
              <Link
                to="/fast-find"
                className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Fast Find
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Stats
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {likedEvents.length} Liked Event
                      {likedEvents.length !== 1 ? "s" : ""}
                    </h3>
                    <p className="text-gray-600">
                      Keep track of events that interest you
                    </p>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedEvents.map((event) => renderEventCard(event))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LikedEventsPage;
