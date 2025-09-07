import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Filter,
  Zap,
  Star,
  PlayCircle,
  PauseCircle,
  XCircle,
  Camera,
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const FastFindPage = () => {
  const { user } = useAuth();
  const [topCities, setTopCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState(10);
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);

  // Event categories
  const categories = [
    "music",
    "food",
    "entertainment",
    "sports",
    "tech",
    "art",
    "business",
    "education",
    "health",
    "other",
  ];

  useEffect(() => {
    fetchTopCities();
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/cache-stats`
      );

      if (response.data.success) {
        setCacheStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching cache stats:", error);
    }
  };

  const fetchTopCities = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/top-cities`
      );

      if (response.data.success) {
        setTopCities(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching top cities:", error);
      toast.error("Failed to load cities");
    }
  };

  const handleFastSearch = async () => {
    if (!selectedCity) {
      toast.error("Please select a city");
      return;
    }

    setLoading(true);
    setSearchPerformed(false);

    try {
      const params = new URLSearchParams({
        city: selectedCity,
        radius: radius.toString(),
      });

      if (category) params.append("category", category);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      console.log("Search params:", Object.fromEntries(params));

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/fast-search?${params}`
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        console.log("Events from API:", response.data.data.events);
        console.log("Number of events:", response.data.data.events?.length);
        console.log("From cache:", response.data.data.fromCache);

        setEvents(response.data.data.events);
        setFromCache(response.data.data.fromCache);
        setSearchPerformed(true);

        if (response.data.data.fromCache) {
          toast.success("⚡ Lightning fast results from cache!");
        } else {
          toast.success("Results loaded from database");
        }

        // Refresh cache stats after search
        fetchCacheStats();
      }
    } catch (error) {
      console.error("Error searching events:", error);
      toast.error("Failed to search events");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, event) => {
    const now = new Date();
    const startDate = new Date(event.dateTime.startDate);
    const endDate = new Date(event.dateTime.endDate);

    let actualStatus = status;

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

  // Helper function to check if event is full
  const isEventFull = (event) => {
    if (!event.pricing) return false;
    const attendeesCount = event.attendees?.length || 0;
    const capacity = event.pricing.totalCapacity || 0;
    return attendeesCount >= capacity;
  };

  // Helper function to check if user is registered
  const isUserRegistered = (event) => {
    if (!user || !event.attendees) return false;
    return event.attendees.some((attendee) => attendee.userId === user.id);
  };

  // Helper function to handle event registration
  const handleRegister = async (eventId) => {
    if (!user) {
      toast.error("Please login to register for events");
      return;
    }

    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/${eventId}/register`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Successfully registered for the event!");
        // Refresh the search to update the registration status
        handleFastSearch();
      } else {
        toast.error(response.data.message || "Failed to register");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error.response?.data?.message || "Failed to register for event"
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group cities by tier
  const citiesByTier = topCities.reduce((acc, city) => {
    if (!acc[city.tier]) acc[city.tier] = [];
    acc[city.tier].push(city);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">
              Fast Find Events
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            Discover events instantly in popular cities across India. Our smart
            caching delivers lightning-fast results for top locations.
          </p>

          {/* Cache Statistics */}
          {cacheStats && (
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>{cacheStats.totalCachedSearches} searches cached</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span>{cacheStats.cachedCities.length} cities cached</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* City Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Select City
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a city...</option>
                {Object.keys(citiesByTier)
                  .sort()
                  .map((tier) => (
                    <optgroup key={tier} label={`Tier ${tier} Cities`}>
                      {citiesByTier[tier].map((city) => (
                        <option key={city.name} value={city.name}>
                          {city.name}, {city.state}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius (km)
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={20}>20 km</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="h-4 w-4 inline mr-1" />
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Query */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 inline mr-1" />
                Search Keywords
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Event name, description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleFastSearch()}
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-center">
            <button
              onClick={handleFastSearch}
              disabled={loading || !selectedCity}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 space-x-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Find Events Fast</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {searchPerformed && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results
                {events.length > 0 && (
                  <span className="text-gray-500 font-normal ml-2">
                    ({events.length} events found)
                  </span>
                )}
              </h2>
              {fromCache && (
                <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                  <Zap className="h-4 w-4 mr-1" />
                  <span>Cached Results</span>
                </div>
              )}
            </div>

            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or selecting a different
                  city.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event._id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Event Image */}
                    {event.images && event.images.length > 0 ? (
                      <div className="h-48 bg-gray-200 overflow-hidden">
                        <img
                          src={event.images[0].url || event.images[0]}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div
                          className="h-full bg-gray-200 flex items-center justify-center"
                          style={{ display: "none" }}
                        >
                          <Camera className="h-12 w-12 text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 bg-gray-200 flex items-center justify-center">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    <div className="p-4">
                      {/* Event Title & Category */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {event.title}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full ml-2">
                          {event.category}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {event.shortDescription || event.description}
                      </p>

                      {/* Venue & Location */}
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {event.venue?.name}, {event.venue?.city}
                        </span>
                        {event.distance && (
                          <span className="ml-2 text-blue-600">
                            ({event.distance.toFixed(1)} km)
                          </span>
                        )}
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(event.dateTime.startDate)}</span>
                      </div>

                      {/* Status, Attendees, Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(event.status, event)}
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <div className="flex items-center text-gray-500">
                            <Users className="h-4 w-4 mr-1" />
                            <span>
                              {event.attendees?.length || 0}
                              {event.pricing?.totalCapacity
                                ? `/${event.pricing.totalCapacity}`
                                : ""}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>
                              {event.pricing?.isFree || event.type === "free"
                                ? "Free"
                                : `₹${
                                    event.pricing?.tickets?.[0]?.price ||
                                    event.pricing?.basePrice ||
                                    0
                                  }`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {isEventFull(event) ? (
                          <button
                            disabled
                            className="w-full bg-gray-400 text-white py-2 px-4 rounded-md cursor-not-allowed text-center"
                          >
                            Event Full
                          </button>
                        ) : isUserRegistered(event) ? (
                          <button
                            disabled
                            className="w-full bg-green-500 text-white py-2 px-4 rounded-md cursor-not-allowed text-center"
                          >
                            ✓ Registered
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(event._id)}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-center"
                          >
                            Register Now
                          </button>
                        )}

                        <Link
                          to={`/events/${event._id}`}
                          className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-center block"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Cities Grid */}
        {!searchPerformed && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              <Star className="h-5 w-5 inline mr-2 text-yellow-500" />
              Popular Cities for Fast Search
            </h2>
            <p className="text-gray-600 mb-6">
              Events in these cities are cached for instant results. Click to
              start searching!
            </p>

            {Object.keys(citiesByTier)
              .sort()
              .map((tier) => (
                <div key={tier} className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">
                    Tier {tier} Cities
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {citiesByTier[tier].map((city) => (
                      <button
                        key={city.name}
                        onClick={() => setSelectedCity(city.name)}
                        className={`p-3 rounded-lg border text-left hover:bg-blue-50 hover:border-blue-300 transition-colors ${
                          selectedCity === city.name
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="font-medium">{city.name}</div>
                        <div className="text-sm text-gray-500">
                          {city.state}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FastFindPage;
