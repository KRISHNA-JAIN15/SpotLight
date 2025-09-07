import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import {
  Building,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminVenuesPage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
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
        const response = await fetch("/api/admin/venues", {
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

  // Filter venues based on search term, status, and type
  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address?.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || venue.approvalStatus === statusFilter;
    const matchesType = typeFilter === "all" || venue.venueType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  const venueTypes = [
    { value: "all", label: "All Types" },
    { value: "auditorium", label: "Auditorium" },
    { value: "stadium", label: "Stadium" },
    { value: "conference_hall", label: "Conference Hall" },
    { value: "outdoor_space", label: "Outdoor Space" },
    { value: "club", label: "Club" },
    { value: "restaurant", label: "Restaurant" },
    { value: "theater", label: "Theater" },
    { value: "arena", label: "Arena" },
    { value: "park", label: "Park" },
    { value: "gallery", label: "Gallery" },
    { value: "other", label: "Other" },
  ];

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
                    All Venues
                  </h1>
                  <p className="text-gray-600">
                    Manage and review all venue submissions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Venues
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, city, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {venueTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                Showing {filteredVenues.length} of {venues.length} venue(s)
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
            <p className="text-gray-600">
              {venues.length === 0
                ? "No venues found"
                : "No venues match your filters"}
            </p>
            {venues.length > 0 && filteredVenues.length === 0 && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredVenues.map((venue) => (
              <div
                key={venue._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {venue.name}
                        </h3>
                        {getStatusBadge(venue.approvalStatus)}
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {venue.description}
                      </p>

                      {/* Venue Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {venue.address?.city}, {venue.address?.state}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            Capacity: {venue.capacity}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Building className="h-4 w-4 mr-2" />
                          <span className="text-sm capitalize">
                            {venue.venueType?.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {new Date(venue.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Owner and Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Owner Information
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>{venue.owner?.name}</div>
                            <div>{venue.owner?.email}</div>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Contact Details
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            {venue.contact?.phone && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {venue.contact.phone}
                              </div>
                            )}
                            {venue.contact?.email && (
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {venue.contact.email}
                              </div>
                            )}
                            {venue.contact?.website && (
                              <div className="flex items-center">
                                <Globe className="h-3 w-3 mr-1" />
                                <a
                                  href={venue.contact.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Website
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Amenities */}
                      {venue.amenities && venue.amenities.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Amenities
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {venue.amenities
                              .slice(0, 5)
                              .map((amenity, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {amenity.replace("_", " ")}
                                </span>
                              ))}
                            {venue.amenities.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{venue.amenities.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {venue.approvalStatus === "rejected" &&
                        venue.rejectionReason && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="text-sm font-medium text-red-900 mb-1">
                              Rejection Reason
                            </h4>
                            <p className="text-sm text-red-800">
                              {venue.rejectionReason}
                            </p>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedVenue(venue);
                        setShowDetails(true);
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    {venue.approvalStatus === "pending" && (
                      <button
                        onClick={() => navigate("/admin/venue-approval")}
                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                      >
                        Review for Approval
                      </button>
                    )}
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
        />
      )}
    </div>
  );
};

// Venue Details Modal Component
const VenueDetailsModal = ({ venue, onClose }) => {
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
            <h3 className="text-lg font-medium text-gray-900">
              {venue.name} - Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-4">
            {/* Complete venue details here - similar to AdminVenueApproval modal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <div className="mt-1">
                  {venue.approvalStatus === "approved" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </span>
                  )}
                  {venue.approvalStatus === "rejected" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Rejected
                    </span>
                  )}
                  {venue.approvalStatus === "pending" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">Type</label>
                <p className="text-sm text-gray-900 capitalize">
                  {venue.venueType?.replace("_", " ")}
                </p>
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

            <div>
              <h4 className="font-medium text-gray-900">Address</h4>
              <p className="text-sm text-gray-900 mt-1">
                {venue.address?.fullAddress ||
                  `${venue.address?.street}, ${venue.address?.city}, ${venue.address?.state} ${venue.address?.pincode}`}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900">Description</h4>
              <p className="text-sm text-gray-900 mt-1">{venue.description}</p>
            </div>

            {/* Images */}
            {venue.images && venue.images.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900">Images</h4>
                <p className="text-sm text-gray-600 mt-1 mb-3">
                  {venue.images.length} image(s) uploaded. Click to view in new
                  tab.
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
                                handleViewImage(image.url, index, image.caption)
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
      </div>
    </div>
  );
};

export default AdminVenuesPage;
