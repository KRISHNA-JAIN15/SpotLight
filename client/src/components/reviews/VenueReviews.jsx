import React, { useState, useEffect, useCallback } from "react";
import {
  Star,
  MapPin,
  Calendar,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import ReviewCard from "./ReviewCard";
import { reviewAPI } from "../../services/api";

const VenueReviews = ({ venueId, venueName }) => {
  const [topReviews, setTopReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchVenueTopReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getVenueTopReviews(venueId);
      setTopReviews(response.reviews || []);
      setAverageRating(response.averageRating || 0);
      setTotalReviews(response.totalReviews || 0);
    } catch (error) {
      console.error("Error fetching venue reviews:", error);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    fetchVenueTopReviews();
  }, [fetchVenueTopReviews]);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${
              i < rating ? "text-yellow-500 fill-current" : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold text-gray-900">
          {rating.toFixed(1)}
        </span>
        <span className="text-sm text-gray-600">
          ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 p-4 rounded-lg">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (topReviews.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Reviews Yet
        </h3>
        <p className="text-gray-500">
          This venue hasn't received any reviews from completed events yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with average rating */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center mb-2">
              <MapPin className="w-5 h-5 mr-2" />
              Reviews for {venueName}
            </h3>
            <div className="flex items-center space-x-4">
              {renderStars(averageRating)}
            </div>
          </div>
        </div>
      </div>

      {/* Top Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Most Recent Reviews
          </h4>
          {totalReviews > 4 && (
            <p className="text-sm text-gray-500">
              Showing most recent 4 of {totalReviews} reviews
            </p>
          )}
        </div>

        <div className="space-y-4">
          {topReviews.map((review, index) => (
            <div key={review._id} className="relative">
              {index === 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  Top Review
                </div>
              )}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {review.user?.name?.charAt(0) || "A"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.user?.name || "Anonymous"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">
                      ({review.rating})
                    </span>
                  </div>
                </div>

                {/* Event context */}
                {review.event && (
                  <div className="mb-3 p-2 bg-gray-50 rounded flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      From event:{" "}
                      <span className="font-medium">{review.event.title}</span>
                      {review.event.dateTime?.startDate && (
                        <span className="ml-2 text-gray-500">
                          •{" "}
                          {new Date(
                            review.event.dateTime.startDate
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <p className="text-gray-700 leading-relaxed">
                  {review.comment}
                </p>

                {review.response && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Response from Venue
                    </p>
                    <p className="text-sm text-blue-700">{review.response}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalReviews > 4 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            Want to see more reviews? Check out individual events at this venue.
          </p>
        </div>
      )}
    </div>
  );
};

export default VenueReviews;
