import React, { useState, useEffect, useCallback } from "react";
import { Star, MessageCircle, AlertCircle } from "lucide-react";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import { reviewAPI } from "../../services/api";

const ReviewList = ({
  eventId,
  currentUserId,
  eventStatus,
  userHasAttended,
}) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [canWriteReview, setCanWriteReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getEventReviews(eventId);
      setReviews(response.reviews || []);

      // Calculate average rating
      if (response.reviews && response.reviews.length > 0) {
        const total = response.reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        setAverageRating((total / response.reviews.length).toFixed(1));
      }

      // Check if current user has already reviewed
      if (currentUserId) {
        const userReview = response.reviews?.find(
          (review) => review.user._id === currentUserId
        );
        setUserHasReviewed(!!userReview);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [eventId, currentUserId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    // Check if user can write a review
    const eventCompleted = eventStatus === "completed";
    const hasAttended = userHasAttended;
    const hasNotReviewed = !userHasReviewed;

    setCanWriteReview(
      eventCompleted && hasAttended && hasNotReviewed && currentUserId
    );
  }, [eventStatus, userHasAttended, userHasReviewed, currentUserId]);

  const handleSubmitReview = async (reviewData) => {
    try {
      setSubmittingReview(true);
      const response = await reviewAPI.createReview(reviewData);

      // Add new review to the list - use response.review which has populated data
      setReviews((prev) => [response.review, ...prev]);
      setUserHasReviewed(true);

      // Recalculate average rating
      const newTotal =
        reviews.reduce((sum, review) => sum + review.rating, 0) +
        reviewData.rating;
      setAverageRating((newTotal / (reviews.length + 1)).toFixed(1));
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars
                ? "text-yellow-500 fill-current"
                : i === fullStars && hasHalfStar
                ? "text-yellow-500 fill-current opacity-50"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">
          ({rating}) • {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Reviews & Ratings
          </h3>
          {reviews.length > 0 && (
            <div className="mt-2">{renderStars(parseFloat(averageRating))}</div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Review Form */}
      {canWriteReview && (
        <ReviewForm
          eventId={eventId}
          onSubmit={handleSubmitReview}
          isLoading={submittingReview}
        />
      )}

      {/* Show info messages */}
      {eventStatus !== "completed" && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-blue-400 mr-2" />
            <p className="text-sm text-blue-600">
              Reviews can only be written after the event is completed.
            </p>
          </div>
        </div>
      )}

      {eventStatus === "completed" && !userHasAttended && currentUserId && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-amber-400 mr-2" />
            <p className="text-sm text-amber-600">
              Only attendees can write reviews for this event.
            </p>
          </div>
        </div>
      )}

      {userHasReviewed && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-green-400 mr-2" />
            <p className="text-sm text-green-600">Thank you for your review!</p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No reviews yet. Be the first to review!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewList;
