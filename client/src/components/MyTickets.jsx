import React, { useState, useEffect, useContext } from "react";
import { Download, Calendar, MapPin, Ticket, Clock, User } from "lucide-react";
import toast from "react-hot-toast";
import AuthContext from "../contexts/AuthContext";
import Navbar from "./Navbar";

const MyTickets = () => {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserTickets = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Please login to view tickets");
          return;
        }

        const userId = user.id || user._id || user.userId;
        if (!userId) {
          toast.error("User ID not found");
          return;
        }

        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/tickets/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        if (data.success) {
          setTickets(data.tickets || []);
        } else {
          throw new Error(data.message || "Failed to fetch tickets");
        }
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast.error(`Failed to load tickets: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserTickets();
    }
  }, [user]);

  const handleDownloadTicket = async (eventId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to download ticket");
        return;
      }

      const userId = user.id || user._id || user.userId;
      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/tickets/download/${eventId}/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download ticket");
      }

      // Create blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Ticket downloaded successfully!");

      // Refresh the page after successful download
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error downloading ticket:", error);
      toast.error("Failed to download ticket. Please try again.");
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

  const isEventPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="p-6 text-center">
        <Navbar />
        <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Tickets Yet
        </h3>
        <p className="text-gray-600 mb-6">
          You haven't registered for any events yet. Start exploring events to
          get your first ticket!
        </p>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Explore Events
        </button>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Tickets</h2>
          <p className="text-gray-600">
            All your event tickets in one place. Download or view anytime.
          </p>
        </div>

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.ticketNumber}
              className={`border rounded-lg p-6 ${
                isEventPast(ticket.eventDate)
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Event Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {ticket.eventTitle}
                  </h3>

                  {/* Event Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(ticket.eventDate)}</span>
                      {isEventPast(ticket.eventDate) && (
                        <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Past Event
                        </span>
                      )}
                    </div>

                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="truncate">{ticket.eventLocation}</span>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Ticket Type:</span>
                        <p className="font-medium capitalize">
                          {ticket.ticketType}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Ticket Number:</span>
                        <p className="font-medium font-mono">
                          {ticket.ticketNumber || "Not generated yet"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <p
                          className={`font-medium ${
                            ticket.ticketGenerated
                              ? "text-green-600"
                              : ticket.isFreeEvent
                              ? "text-blue-600"
                              : ticket.paymentStatus === "completed"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {ticket.ticketGenerated
                            ? "Ready for Download"
                            : ticket.isFreeEvent
                            ? "Free Event - Generate Ticket"
                            : ticket.paymentStatus === "completed"
                            ? "Payment Complete - Generate Ticket"
                            : "Payment Required"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Event Type:</span>
                        <p className="font-medium">
                          {ticket.isFreeEvent
                            ? "Free Event"
                            : `Paid Event - ₹${ticket.ticketPrice}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      Registered on {formatDate(ticket.registrationDate)}
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                <div className="ml-6">
                  <button
                    onClick={() => handleDownloadTicket(ticket.eventId)}
                    disabled={
                      !ticket.isFreeEvent &&
                      ticket.paymentStatus !== "completed"
                    }
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !ticket.isFreeEvent &&
                      ticket.paymentStatus !== "completed"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : isEventPast(ticket.eventDate)
                        ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        : ticket.ticketGenerated
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {!ticket.isFreeEvent && ticket.paymentStatus !== "completed"
                      ? "Payment Required"
                      : ticket.ticketGenerated
                      ? "Download Ticket"
                      : "Generate & Download"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">
              You have {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}{" "}
              in total
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
