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
  Share2,
  DollarSign,
  Navigation,
  AlertCircle,
  UserCheck,
  UserPlus,
  BookmarkIcon,
  History,
  CalendarDays,
  PlayCircle,
  PauseCircle,
  XCircle,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import TicketSelectionModal from "../components/TicketSelectionModal";
import PaymentModal from "../components/PaymentModal";
import RegistrationSuccessModal from "../components/RegistrationSuccessModal";
import axios from "axios";

const DashboardPage = () => {
  const {
    user,
    isAuthenticated,
    requiresProfileCompletion,
    logout: _logout,
  } = useAuth();

  // Tab states
  const [activeTab, setActiveTab] = useState("discover");

  // Discover tab states
  const [discoverEvents, setDiscoverEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({});

  // Other tabs states
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [likedEvents, setLikedEvents] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [likedEventIds, setLikedEventIds] = useState(new Set());

  // Payment flow state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [registrationData, setRegistrationData] = useState(null);

  useEffect(() => {
    getUserLocation();
    fetchLikedEventIds(); // Fetch liked events to know heart status
    // Don't fetch discover events here - wait for userLocation to be set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchDiscoverEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy, userLocation]);

  useEffect(() => {
    if (discoverEvents.length > 0) {
      fetchRegistrationStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoverEvents]);

  useEffect(() => {
    if (activeTab !== "discover") {
      fetchTabData(activeTab);
    }
  }, [activeTab]);

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

  const fetchDiscoverEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      // Ensure we only fetch upcoming events for discovery
      params.append("status", "upcoming");

      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      if (sortBy) {
        params.append("sort", sortBy);
      }

      if (userLocation) {
        params.append("latitude", userLocation.latitude);
        params.append("longitude", userLocation.longitude);
        // Radius will be determined by user's profile preference on backend
      }

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Dashboard API Response:", response.data);
      console.log(
        "Events received:",
        response.data.data?.events || response.data.data
      );

      if (response.data.success) {
        // Handle the new nested API response structure
        const eventsData = response.data.data.events || response.data.data;
        console.log("Setting discoverEvents to:", eventsData);
        setDiscoverEvents(Array.isArray(eventsData) ? eventsData : []);
      } else {
        setDiscoverEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to fetch events");
      setDiscoverEvents([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab) => {
    try {
      setTabLoading(true);
      let endpoint = "";

      switch (tab) {
        case "registered":
          endpoint = "/api/events/my-registrations";
          break;
        case "past":
          endpoint = "/api/events/my-past-events";
          break;
        case "liked":
          endpoint = "/api/events/my-liked";
          break;
        default:
          return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const data = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        switch (tab) {
          case "registered":
            setRegisteredEvents(data);
            break;
          case "past":
            setPastEvents(data);
            break;
          case "liked":
            setLikedEvents(data);
            break;
        }
      } else {
        // Set empty arrays for failed requests
        switch (tab) {
          case "registered":
            setRegisteredEvents([]);
            break;
          case "past":
            setPastEvents([]);
            break;
          case "liked":
            setLikedEvents([]);
            break;
        }
      }
    } catch (error) {
      console.error(`Error fetching ${tab} events:`, error);
      toast.error(`Failed to fetch ${tab} events`);
      // Set empty arrays for failed requests
      switch (tab) {
        case "registered":
          setRegisteredEvents([]);
          break;
        case "past":
          setPastEvents([]);
          break;
        case "liked":
          setLikedEvents([]);
          break;
      }
    } finally {
      setTabLoading(false);
    }
  };

  const fetchLikedEventIds = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/my-liked`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const likedData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setLikedEventIds(new Set(likedData.map((event) => event._id)));
      }
    } catch (error) {
      console.error("Error fetching liked event IDs:", error);
    }
  };

  const fetchRegistrationStatuses = async () => {
    try {
      if (!Array.isArray(discoverEvents) || discoverEvents.length === 0) {
        return;
      }

      const statuses = {};
      await Promise.all(
        discoverEvents.map(async (event) => {
          try {
            const response = await axios.get(
              `${
                import.meta.env.VITE_API_URL || "http://localhost:5000"
              }/api/events/${event._id}/registration-status`,
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

  const handleRegisterForEvent = async (event) => {
    try {
      // Check if event is paid
      if (!event.pricing?.isFree && event.pricing?.tickets?.length > 0) {
        // Show ticket selection modal for paid events
        setSelectedEvent(event);
        setShowTicketModal(true);
        return;
      }

      // For free events, register directly
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/${event._id}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Successfully registered for event!");

        // Set registration data for success modal
        setRegistrationData({
          event,
          ticketDetails: {
            ticketType: "General",
            quantity: 1,
            totalAmount: 0,
          },
          paymentId: null,
          ticketNumber: response.data.data.ticketNumber,
        });

        setShowSuccessModal(true);
        fetchRegistrationStatuses();
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message || "Failed to register for event"
      );
    }
  };

  const handleTicketSelection = (tickets, total) => {
    setSelectedTickets(tickets);
    setTotalAmount(total);
    setShowTicketModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    setShowPaymentModal(false);
    setSelectedTickets([]);
    setTotalAmount(0);

    // Set registration data for success modal
    setRegistrationData({
      event: selectedEvent,
      ticketDetails: {
        ticketType: selectedTickets[0]?.ticketType,
        quantity: selectedTickets.reduce((sum, t) => sum + t.quantity, 0),
        totalAmount,
      },
      paymentId: paymentData.paymentId,
      ticketNumber: paymentData.ticketNumber,
    });

    setShowSuccessModal(true);

    // Refresh registration statuses
    fetchRegistrationStatuses();
  };

  const handleCloseModals = () => {
    setShowTicketModal(false);
    setShowPaymentModal(false);
    setShowSuccessModal(false);
    setSelectedEvent(null);
    setSelectedTickets([]);
    setTotalAmount(0);
    setRegistrationData(null);
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

      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/${eventId}/toggle-like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh the appropriate tab data
        if (activeTab === "liked") {
          fetchTabData("liked");
        }
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

  const tabs = [
    { id: "discover", label: "Discover Events", icon: Navigation },
    { id: "registered", label: "My Registrations", icon: CalendarDays },
    { id: "past", label: "Past Events", icon: History },
    { id: "liked", label: "Liked Events", icon: BookmarkIcon },
  ];

  const renderEventCard = (event, showRegistrationInfo = false) => {
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

          {/* Registration Info for specific tabs */}
          {showRegistrationInfo && event.registration && (
            <div className="mb-4 p-2 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-600">
                <div>Ticket: {event.registration.ticketType}</div>
                <div>Quantity: {event.registration.quantity}</div>
                <div>Status: {event.registration.paymentStatus}</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {event.category}
            </div>

            <div className="flex items-center space-x-2">
              {activeTab === "discover" &&
                !isRegistered &&
                !isEventFull(event) && (
                  <button
                    onClick={() => handleRegisterForEvent(event)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Register
                  </button>
                )}

              {activeTab === "discover" &&
                !isRegistered &&
                isEventFull(event) && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-md flex items-center">
                    <Users className="h-3 w-3 mr-1" />
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "discover":
        return (
          <>
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
            ) : !Array.isArray(discoverEvents) ||
              discoverEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No events found
                </h3>
                <p className="text-gray-600">
                  {userLocation
                    ? "No events found within 15km of your location."
                    : "Please update your location to see nearby events."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoverEvents.map((event) => renderEventCard(event))}
              </div>
            )}
          </>
        );

      case "registered":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CalendarDays className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                My Registrations
              </h2>
              <p className="text-gray-600">
                Events you've registered for and are upcoming
              </p>
            </div>

            {tabLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : registeredEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No registrations yet
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't registered for any events yet.
                </p>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Discover Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registeredEvents.map((event) => renderEventCard(event, true))}
              </div>
            )}
          </div>
        );

      case "past":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <History className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Past Events
              </h2>
              <p className="text-gray-600">
                Events you've attended in the past
              </p>
            </div>

            {tabLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : pastEvents.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No past events
                </h3>
                <p className="text-gray-600">
                  You haven't attended any events yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => renderEventCard(event, true))}
              </div>
            )}
          </div>
        );

      case "liked":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BookmarkIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Liked Events
              </h2>
              <p className="text-gray-600">
                Events you've bookmarked and liked
              </p>
            </div>

            {tabLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : likedEvents.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No liked events
                </h3>
                <p className="text-gray-600 mb-4">
                  You haven't liked any events yet.
                </p>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Discover Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedEvents.map((event) => renderEventCard(event))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
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
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-gray-600 mt-1">
                Discover and manage your events
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 bg-gray-200 rounded-4xl ">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>

      {/* Ticket Selection Modal */}
      <TicketSelectionModal
        event={selectedEvent}
        isOpen={showTicketModal}
        onClose={handleCloseModals}
        onProceedToPayment={handleTicketSelection}
      />

      {/* Payment Modal */}
      <PaymentModal
        event={selectedEvent}
        tickets={selectedTickets}
        totalAmount={totalAmount}
        isOpen={showPaymentModal}
        onClose={handleCloseModals}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Registration Success Modal */}
      <RegistrationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModals}
        registrationData={registrationData}
      />
    </div>
  );
};

export default DashboardPage;
