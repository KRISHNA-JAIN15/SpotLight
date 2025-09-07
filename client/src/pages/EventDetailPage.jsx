import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Mail,
  Phone,
  Tag,
  UserPlus,
  UserCheck,
  Eye,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (event && user?.type === "user") {
      fetchRegistrationStatus();
    }
  }, [event, user]);

  const fetchRegistrationStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/events/${id}/registration-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRegistrationStatus(response.data.data);
    } catch (error) {
      console.error("Error fetching registration status:", error);
    }
  };

  const handleRegisterForEvent = async () => {
    try {
      setRegistrationLoading(true);
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `/events/${id}/register`,
        { ticketType: "General", quantity: 1 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setRegistrationStatus({
          isRegistered: true,
          registration: {
            user: user.id,
            ticketType: "General",
            quantity: 1,
            paymentStatus: "completed",
            bookingDate: new Date(),
          },
        });
        // Refresh event to update attendee count
        fetchEventDetails();
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to register for event";
      toast.error(errorMessage);
    } finally {
      setRegistrationLoading(false);
    }
  };

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`/events/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEvent(response.data.data.event);
    } catch (error) {
      console.error("Error fetching event details:", error);
      setError(
        error.response?.data?.message || "Failed to fetch event details"
      );
      if (error.response?.status === 404) {
        toast.error("Event not found");
        navigate("/my-events");
      }
    } finally {
      setLoading(false);
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <Icon className="h-4 w-4 mr-2" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEventUpcoming = (startDate) => {
    return new Date(startDate) > new Date();
  };

  const isEventFull = () => {
    if (!event?.pricing?.totalCapacity) return false;
    const attendeesCount = event.attendees?.length || 0;
    return attendeesCount >= event.pricing.totalCapacity;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="bg-gray-200 h-8 w-64 mb-4 rounded"></div>
            <div className="bg-gray-200 h-64 rounded-lg mb-6"></div>
            <div className="space-y-4">
              <div className="bg-gray-200 h-4 w-full rounded"></div>
              <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
              <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Error loading event
            </h3>
            <p className="mt-2 text-gray-500">{error}</p>
            <Link
              to="/my-events"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Event not found
            </h3>
            <Link
              to="/my-events"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/my-events"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Events
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                {getStatusBadge(event.status, event)}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {event.pricing?.isFree ? "Free" : "Paid"}
                </span>
                <span className="text-gray-600 capitalize">
                  {event.category}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Show edit button only for event organizers */}
              {user?.type === "event_manager" &&
                event?.organizer?._id === user.id &&
                isEventUpcoming(event.dateTime?.startDate) &&
                event.status === "upcoming" && (
                  <Link
                    to={`/edit-event/${event._id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Edit className="h-4 w-4 mr-2 inline" />
                    Edit Event
                  </Link>
                )}

              {/* Show registration button for regular users */}
              {user?.type === "user" &&
                isEventUpcoming(event.dateTime?.startDate) &&
                event.status === "upcoming" && (
                  <div>
                    {registrationStatus?.isRegistered ? (
                      <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-md">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Registered
                      </div>
                    ) : isEventFull() ? (
                      <div className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-md">
                        <Users className="h-4 w-4 mr-2" />
                        Event Full
                      </div>
                    ) : (
                      <button
                        onClick={handleRegisterForEvent}
                        disabled={registrationLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {registrationLoading ? "Registering..." : "Register"}
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Images */}
            {event.images && event.images.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Event Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={image.caption || `Event photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {image.caption && (
                          <p className="mt-1 text-sm text-gray-600">
                            {image.caption}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>

            {/* Venue Information */}
            {event.venue && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Venue</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {event.venue.name}
                    </h3>
                    <p className="text-gray-600">
                      {event.venue.address?.city}, {event.venue.address?.state}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Capacity: {event.venue.capacity} people
                    </p>
                  </div>
                  <Link
                    to={`/venues/${event.venue._id}`}
                    className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Venue
                  </Link>
                </div>
              </div>
            )}

            {/* Pricing Details */}
            {!event.pricing?.isFree &&
              event.pricing?.tickets &&
              event.pricing.tickets.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Ticket Pricing</h2>
                  <div className="space-y-3">
                    {event.pricing.tickets.map((ticket, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {ticket.type}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {ticket.quantity.available} /{" "}
                            {ticket.quantity.total} available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₹{ticket.price}
                          </p>
                          <p className="text-sm text-gray-600">
                            {ticket.quantity.sold} sold
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Event Details</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Start Date</p>
                    <p className="text-gray-600">
                      {formatDate(event.dateTime?.startDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">End Date</p>
                    <p className="text-gray-600">
                      {formatDate(event.dateTime?.endDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Attendees</p>
                    <p className="text-gray-600">
                      {event.attendees?.length || 0} /{" "}
                      {event.pricing?.totalCapacity} registered
                    </p>
                  </div>
                </div>

                {!event.pricing?.isFree && (
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Starting Price
                      </p>
                      <p className="text-gray-600">
                        ₹
                        {Math.min(
                          ...(event.pricing?.tickets?.map((t) => t.price) || [
                            0,
                          ])
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show views only for event organizers and admins */}
                {(user?.type === "event_manager" || user?.type === "admin") && (
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Views</p>
                      <p className="text-gray-600">{event.totalViews || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            {event.contactInfo && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Contact Information
                </h2>
                <div className="space-y-3">
                  {event.contactInfo.email && (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={`mailto:${event.contactInfo.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {event.contactInfo.email}
                      </a>
                    </div>
                  )}

                  {event.contactInfo.phone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={`tel:${event.contactInfo.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {event.contactInfo.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Statistics</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {new Date(event.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration Rate:</span>
                  <span className="font-medium">
                    {event.pricing?.totalCapacity
                      ? Math.round(
                          ((event.attendees?.length || 0) /
                            event.pricing.totalCapacity) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
