import React, { useContext } from "react";
import { CheckCircle, Calendar, MapPin, Download, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import AuthContext from "../contexts/AuthContext";

const RegistrationSuccessModal = ({ isOpen, onClose, registrationData }) => {
  const { user } = useContext(AuthContext);

  if (!isOpen || !registrationData) return null;

  const { event, ticketDetails, paymentId } = registrationData;

  const handleDownloadTicket = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to download ticket");
        return;
      }

      // Defensive user ID resolution
      const userId = user?.id || user?._id || user?.userId;

      if (!userId) {
        toast.error(
          "User information not available. Please refresh and try again."
        );
        return;
      }

      // Download existing ticket
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/tickets/download/${event._id}/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate ticket");
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

  const handleShareEvent = () => {
    // Share event functionality
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `I'm attending ${event.title}!`,
        url: window.location.href,
      });
    } else {
      // Fallback to copy URL
      navigator.clipboard.writeText(window.location.href);
      toast.success("Event URL copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Success Header */}
        <div className="p-6 text-center border-b border-gray-200">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h2>
          <p className="text-gray-600">You're all set for {event.title}</p>
        </div>

        {/* Event Details */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">{event.title}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(event.dateTime.startDate).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {event.venue?.name}
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          {ticketDetails && (
            <div className="border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Your Tickets</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">
                    {ticketDetails.quantity}x {ticketDetails.ticketType}
                  </span>
                  <span className="font-medium">
                    ₹{ticketDetails.totalAmount}
                  </span>
                </div>
                {paymentId && (
                  <div className="text-xs text-gray-500">
                    Payment ID: {paymentId}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadTicket}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Ticket
            </button>

            <button
              onClick={handleShareEvent}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Event
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessModal;
