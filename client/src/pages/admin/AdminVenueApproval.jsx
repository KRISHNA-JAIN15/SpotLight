import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";
import {
  Building,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ArrowLeft,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminVenueApproval = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [approving, setApproving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.type !== "admin") {
      toast.error("Access denied. Admin only.");
      navigate("/");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/venues?status=pending", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVenues(data.data.venues || []);
        } else {
          toast.error("Failed to fetch venues");
        }
      } catch (error) {
        console.error("Error fetching venues:", error);
        toast.error("Failed to fetch venues");
      } finally {
        setLoading(false);
      }
    };

    if (user?.type === "admin") {
      fetchVenues();
    }
  }, [user]);

  const handleApproval = async (venueId, status, rejectionReason = "") => {
    try {
      setApproving(true);
      const response = await fetch(`/api/venues/${venueId}/approval`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          approvalStatus: status,
          rejectionReason: status === "rejected" ? rejectionReason : undefined,
        }),
      });

      if (response.ok) {
        toast.success(`Venue ${status} successfully`);
        // Refresh venues list
        setVenues(venues.filter((v) => v._id !== venueId));
        setShowDetails(false);
        setSelectedVenue(null);
      } else {
        const error = await response.json();
        toast.error(error.message || `Failed to ${status} venue`);
      }
    } catch (error) {
      console.error("Error updating venue approval:", error);
      toast.error(`Failed to ${status} venue`);
    } finally {
      setApproving(false);
    }
  };

  const filteredVenues = venues;

  if (!isAuthenticated || user?.type !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/admin")}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Pending Venue Approvals
                  </h1>
                  <p className="text-gray-600">
                    Review and approve pending venue submissions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Venues List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading venues...</p>
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pending venues found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVenues.map((venue) => (
              <div
                key={venue._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {venue.name}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {venue.address?.city}, {venue.address?.state}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          Capacity: {venue.capacity}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <span className="text-sm">
                          Owner: {venue.owner?.name}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          venue.approvalStatus === "approved"
                            ? "bg-green-100 text-green-800"
                            : venue.approvalStatus === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {venue.approvalStatus === "approved" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {venue.approvalStatus === "rejected" && (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {venue.approvalStatus === "pending" && (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {venue.approvalStatus.charAt(0).toUpperCase() +
                          venue.approvalStatus.slice(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {venue.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Submitted:{" "}
                      {new Date(venue.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedVenue(venue);
                          setShowDetails(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </button>
                      {venue.approvalStatus === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleApproval(venue._id, "approved")
                            }
                            disabled={approving}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVenue(venue);
                              setShowDetails(true);
                            }}
                            disabled={approving}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Venue Details Modal */}
      {showDetails && selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => {
            setShowDetails(false);
            setSelectedVenue(null);
          }}
          onApprove={(rejectionReason) =>
            handleApproval(selectedVenue._id, "approved")
          }
          onReject={(rejectionReason) =>
            handleApproval(selectedVenue._id, "rejected", rejectionReason)
          }
          approving={approving}
        />
      )}
    </div>
  );
};

// Venue Details Modal Component
const VenueDetailsModal = ({
  venue,
  onClose,
  onApprove,
  onReject,
  approving,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const navigate = useNavigate();

  const handleViewImage = (imageUrl, index, caption = "") => {
    navigate("/admin/venue-image", {
      state: {
        imageUrl: imageUrl,
        imageName: `Image ${index + 1}`,
        imageCaption: caption,
        venueName: venue.name,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Venue Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Basic Information</h4>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{venue.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Type</label>
                    <p className="text-sm text-gray-900">{venue.venueType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Capacity</label>
                    <p className="text-sm text-gray-900">{venue.capacity}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Owner</label>
                    <p className="text-sm text-gray-900">{venue.owner?.name}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Address</h4>
                <p className="text-sm text-gray-900 mt-1">
                  {venue.address?.fullAddress}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-sm text-gray-900 mt-1">
                  {venue.description}
                </p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">
                  Contact Information
                </h4>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="text-sm text-gray-900">
                      {venue.contact?.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">
                      {venue.contact?.email || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {venue.amenities && venue.amenities.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Amenities</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {venue.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {amenity.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {venue.images && venue.images.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Images</h4>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    {venue.images.length} image(s) uploaded. Click to view in
                    new tab.
                  </p>
                  <div className="mt-2 space-y-3">
                    {venue.images.map(
                      (image, index) =>
                        image.url && (
                          <div
                            key={index}
                            className="p-4 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center mb-2">
                                  <div className="h-4 w-4 bg-blue-600 rounded mr-3"></div>
                                  <span className="text-sm font-medium text-gray-700">
                                    Venue Image {index + 1}
                                    {index === 0 && " (Primary)"}
                                  </span>
                                </div>
                                {image.caption && (
                                  <p className="text-sm text-gray-600 ml-7 mb-2">
                                    "{image.caption}"
                                  </p>
                                )}
                                {!image.caption && (
                                  <p className="text-xs text-gray-400 ml-7">
                                    No description provided
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  handleViewImage(
                                    image.url,
                                    index,
                                    image.caption
                                  )
                                }
                                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-medium rounded text-blue-600 bg-white hover:bg-blue-50 transition-colors ml-4"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Full Size
                              </button>
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {venue.approvalStatus === "pending" && (
            <div className="mt-6 border-t pt-4">
              {!showRejectForm ? (
                <div className="flex space-x-3">
                  <button
                    onClick={onApprove}
                    disabled={approving}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {approving ? "Approving..." : "Approve Venue"}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={approving}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Reject Venue
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please provide a reason for rejection..."
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        if (rejectionReason.trim()) {
                          onReject(rejectionReason);
                        } else {
                          toast.error("Please provide a rejection reason");
                        }
                      }}
                      disabled={approving || !rejectionReason.trim()}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {approving ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason("");
                      }}
                      disabled={approving}
                      className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVenueApproval;
