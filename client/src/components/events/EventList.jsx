import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  PlayCircle,
  PauseCircle,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

const EventList = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/events/my-events`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEvents(response.data.data.events);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError(error.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/events/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setEvents(events.filter((event) => event._id !== eventId));
        toast.success("Event deleted successfully");
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error(error.response?.data?.message || "Failed to delete event");
      }
    }
  };

  const handleCancelEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to cancel this event?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/events/${eventId}/cancel`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setEvents(
          events.map((event) =>
            event._id === eventId ? { ...event, status: "cancelled" } : event
          )
        );
        toast.success("Event cancelled successfully");
      } catch (error) {
        console.error("Error cancelling event:", error);
        toast.error(error.response?.data?.message || "Failed to cancel event");
      }
    }
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
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEventUpcoming = (startDate) => {
    return new Date(startDate) > new Date();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600">
            Manage your events and track performance
          </p>
        </div>
        <Link
          to="/add-event"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Create New Event
        </Link>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No events yet
          </h3>
          <p className="mt-2 text-gray-500">
            Get started by creating your first event
          </p>
          <Link
            to="/add-event"
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Event
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden "
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {event.title}
                      </h3>
                      {getStatusBadge(event.status, event)}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {event.pricing?.isFree ? "Free" : "Paid"}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(event.dateTime?.startDate)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.venue?.name || "Venue TBD"}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {event.attendees?.length || 0}/
                        {event.pricing?.totalCapacity}
                      </div>
                      {!event.pricing?.isFree &&
                        event.pricing?.tickets?.[0]?.price && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            From ₹{event.pricing.tickets[0].price}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/events/${event._id}`}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {isEventUpcoming(event.dateTime?.startDate) &&
                      event.status === "upcoming" && (
                        <Link
                          to={`/edit-event/${event._id}`}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      )}
                    {event.status === "upcoming" && (
                      <button
                        onClick={() => handleCancelEvent(event._id)}
                        className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
                      >
                        <PauseCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        Category:
                      </span>
                      <div className="text-gray-600 capitalize">
                        {event.category}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Duration:
                      </span>
                      <div className="text-gray-600">
                        {formatDate(event.dateTime?.startDate)} -{" "}
                        {formatDate(event.dateTime?.endDate)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Created:
                      </span>
                      <div className="text-gray-600">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Registration:
                      </span>
                      <div className="text-gray-600">
                        {event.attendees?.length || 0} registered
                      </div>
                    </div>
                  </div>
                </div>

                {/* Venue Info */}
                {event.venue && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-700">
                          Venue:
                        </span>
                        <div className="text-gray-600">
                          {event.venue.name} - {event.venue.address?.city},{" "}
                          {event.venue.address?.state}
                        </div>
                      </div>
                      <Link
                        to={`/venues/${event.venue._id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm bg-blue-300 rounded-md px-2 py-2 "
                      >
                        View Venue →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <span className="font-medium text-gray-700 block mb-2">
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Details for Paid Events */}
                {!event.pricing?.isFree &&
                  event.pricing?.tickets &&
                  event.pricing.tickets.length > 0 && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <span className="font-medium text-gray-700 block mb-2">
                        Pricing:
                      </span>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {event.pricing.tickets.map((ticket, index) => (
                          <span key={index} className="text-gray-600">
                            {ticket.type}: ₹{ticket.price}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventList;
