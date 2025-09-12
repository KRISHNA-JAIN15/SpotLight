import React, { useState, useEffect } from "react";
import {
  MapPin,
  Users,
  Building,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";
import axios from "axios";

const PendingVenueApprovals = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingVenue, setProcessingVenue] = useState(null);

  useEffect(() => {
    fetchPendingVenues();
  }, []);

  const fetchPendingVenues = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/venues/admin/pending");
      setVenues(response.data.data.venues);
    } catch (error) {
      console.error("Error fetching pending venues:", error);
      setError(
        error.response?.data?.message || "Failed to fetch pending venues"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (venueId, action, rejectionReason = "") => {
    try {
      setProcessingVenue(venueId);
      const payload = { action };
      if (action === "reject" && rejectionReason) {
        payload.rejectionReason = rejectionReason;
      }

      await axios.put(`/venues/${venueId}/approval`, payload);

      // Remove the venue from the list
      setVenues(venues.filter((venue) => venue._id !== venueId));
    } catch (error) {
      console.error("Error processing venue approval:", error);
      alert(
        error.response?.data?.message || "Failed to process venue approval"
      );
    } finally {
      setProcessingVenue(null);
    }
  };

  const handleReject = (venue) => {
    const rejectionReason = prompt(
      `Please provide a reason for rejecting "${venue.name}":`
    );

    if (rejectionReason) {
      handleApproval(venue._id, "reject", rejectionReason);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-48 rounded-lg"></div>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Pending Venue Approvals
        </h1>
        <p className="text-gray-600">
          Review and approve venue submissions from event managers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Pending Review
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {venues.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Venues</p>
              <p className="text-2xl font-bold text-gray-900">
                {/* This would come from API */}-
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Event Managers
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {/* This would come from API */}-
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Venues List */}
      {venues.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No pending approvals
          </h3>
          <p className="mt-2 text-gray-500">
            All venue submissions have been reviewed
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {venues.map((venue) => (
            <div
              key={venue._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {venue.name}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Review
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{venue.description}</p>

                    {/* Venue Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>
                          {venue.city}, {venue.state}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{venue.capacity} capacity</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Building className="h-4 w-4 mr-1" />
                        <span className="capitalize">
                          {venue.type?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        <span>Created: {new Date(venue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Owner Information */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Submitted By
                      </h4>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-gray-600">
                            {venue.owner?.name}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {venue.owner?.email}
                        </div>
                        <div className="text-gray-500">
                          Submitted:{" "}
                          {new Date(venue.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Full Address */}
                    <div className="mb-4">
                      <span className="font-medium text-gray-700">
                        Full Address:
                      </span>
                      <div className="text-gray-600">
                        {venue.address}, {venue.city}, {venue.state}
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(venue.contactPhone || venue.contactEmail) && (
                      <div className="mb-4">
                        <span className="font-medium text-gray-700">
                          Contact:
                        </span>
                        <div className="text-gray-600 text-sm">
                          {venue.contactPhone && (
                            <div>Phone: {venue.contactPhone}</div>
                          )}
                          {venue.contactEmail && (
                            <div>Email: {venue.contactEmail}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Amenities */}
                    {venue.amenities && venue.amenities.length > 0 && (
                      <div className="mb-4">
                        <span className="font-medium text-gray-700 block mb-2">
                          Amenities:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {venue.amenities.map((amenity, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Location Coordinates */}
                    {venue.location && (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Coordinates:</span>{" "}
                        {venue.location.coordinates[1]},{" "}
                        {venue.location.coordinates[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handleReject(venue)}
                      disabled={processingVenue === venue._id}
                      className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processingVenue === venue._id
                        ? "Processing..."
                        : "Reject"}
                    </button>

                    <button
                      onClick={() => handleApproval(venue._id, "approve")}
                      disabled={processingVenue === venue._id}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processingVenue === venue._id
                        ? "Processing..."
                        : "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingVenueApprovals;
