import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Users,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";

const VenueList = () => {
  const { user: _user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/venues/my/venues", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVenues(response.data.data.venues);
    } catch (error) {
      console.error("Error fetching venues:", error);
      setError(error.response?.data?.message || "Failed to fetch venues");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (window.confirm("Are you sure you want to delete this venue?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/venues/${venueId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setVenues(venues.filter((venue) => venue._id !== venueId));
      } catch (error) {
        console.error("Error deleting venue:", error);
        alert(error.response?.data?.message || "Failed to delete venue");
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        text: "Pending Approval",
      },
      approved: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        text: "Approved",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
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
          <h1 className="text-2xl font-bold text-gray-900">My Venues</h1>
          <p className="text-gray-600">
            Manage your venue listings and track approval status
          </p>
        </div>
        <Link
          to="/add-venue"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Add New Venue
        </Link>
      </div>

      {/* Venues List */}
      {venues.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No venues yet
          </h3>
          <p className="mt-2 text-gray-500">
            Get started by adding your first venue
          </p>
          <Link
            to="/add-venue"
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Venue
          </Link>
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
                      {getStatusBadge(venue.approvalStatus)}
                    </div>
                    <p className="text-gray-600 mb-2">{venue.description}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {venue.address?.city || "City"},{" "}
                        {venue.address?.state || "State"}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {venue.capacity} capacity
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />$
                        {venue.pricePerHour}/hour
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/venues/${venue._id}`}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {venue.approvalStatus !== "approved" && (
                      <Link
                        to={`/edit-venue/${venue._id}`}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleDeleteVenue(venue._id)}
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
                      <span className="font-medium text-gray-700">Type:</span>
                      <div className="text-gray-600 capitalize">
                        {venue.venueType
                          ? venue.venueType.replace("_", " ")
                          : "Not specified"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Address:
                      </span>
                      <div className="text-gray-600">
                        {venue.address?.fullAddress ||
                          `${venue.address?.street || ""} ${
                            venue.address?.city || ""
                          }, ${venue.address?.state || ""}`.trim() ||
                          "Address not provided"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Created:
                      </span>
                      <div className="text-gray-600">
                        {new Date(venue.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {venue.approvalStatus === "rejected" &&
                      venue.rejectionReason && (
                        <div className="col-span-2 md:col-span-4">
                          <span className="font-medium text-red-700">
                            Rejection Reason:
                          </span>
                          <div className="text-red-600 mt-1">
                            {venue.rejectionReason}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Amenities */}
                {venue.amenities && venue.amenities.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <span className="font-medium text-gray-700 block mb-2">
                      Amenities:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {venue.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {amenity}
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

export default VenueList;
