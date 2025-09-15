import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Users,
  DollarSign,
  Phone,
  Mail,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Star,
  Wifi,
  Car,
  Camera,
  Shield,
  Utensils,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import VenueReviews from "../components/reviews/VenueReviews";

const VenueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVenueDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`/venues/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVenue(response.data.data.venue);
    } catch (error) {
      console.error("Error fetching venue details:", error);
      setError(
        error.response?.data?.message || "Failed to fetch venue details"
      );
      if (error.response?.status === 404) {
        toast.error("Venue not found");
        navigate("/my-venues");
      }
    } finally {
      setLoading(false);
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
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}
      >
        <Icon className="h-4 w-4 mr-2" />
        {config.text}
      </span>
    );
  };

  const getAmenityIcon = (amenity) => {
    const icons = {
      wifi: Wifi,
      parking: Car,
      security: Shield,
      catering: Utensils,
      photography: Camera,
    };
    return icons[amenity] || CheckCircle;
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
              Error loading venue
            </h3>
            <p className="mt-2 text-gray-500">{error}</p>
            <Link
              to="/my-venues"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Venues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Venue not found
            </h3>
            <Link
              to="/my-venues"
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Venues
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
            to="/my-venues"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Venues
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {venue.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                {getStatusBadge(venue.approvalStatus)}
                <span className="text-gray-600 capitalize">
                  {venue.venueType?.replace("_", " ")} • {venue.capacity}{" "}
                  capacity
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {venue.approvalStatus !== "approved" && (
                <Link
                  to={`/edit-venue/${venue._id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Venue
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {venue.images && venue.images.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Photos</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {venue.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.url}
                          alt={image.caption || `Venue photo ${index + 1}`}
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
              <h2 className="text-xl font-semibold mb-4">About This Venue</h2>
              <p className="text-gray-700 leading-relaxed">
                {venue.description || "No description provided."}
              </p>
            </div>

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.amenities.map((amenity, index) => {
                    const Icon = getAmenityIcon(amenity);
                    return (
                      <div key={index} className="flex items-center">
                        <Icon className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-700 capitalize">
                          {amenity.replace("_", " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {venue.approvalStatus === "rejected" && venue.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-red-800 mb-4">
                  Rejection Reason
                </h2>
                <p className="text-red-700">{venue.rejectionReason}</p>
              </div>
            )}

            {/* Venue Reviews */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <VenueReviews venueId={venue._id} venueName={venue.name} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Venue Details</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-gray-600">
                      {venue.address?.fullAddress ||
                        `${venue.address?.street || ""} ${
                          venue.address?.city || ""
                        }, ${venue.address?.state || ""} ${
                          venue.address?.pincode || ""
                        }`.trim()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Capacity</p>
                    <p className="text-gray-600">{venue.capacity} people</p>
                  </div>
                </div>

                {venue.pricePerHour && (
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Price</p>
                      <p className="text-gray-600">
                        ₹{venue.pricePerHour}/hour
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Created</p>
                    <p className="text-gray-600">
                      {new Date(venue.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {venue.contact && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Contact Information
                </h2>
                <div className="space-y-3">
                  {venue.contact.phone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={`tel:${venue.contact.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {venue.contact.phone}
                      </a>
                    </div>
                  )}

                  {venue.contact.email && (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={`mailto:${venue.contact.email}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {venue.contact.email}
                      </a>
                    </div>
                  )}

                  {venue.contact.website && (
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-gray-400 mr-3" />
                      <a
                        href={venue.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Map Placeholder
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Map integration coming soon</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailPage;
