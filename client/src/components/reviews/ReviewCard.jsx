import React from "react";
import { Star, User } from "lucide-react";

const ReviewCard = ({ review, showEventInfo = false }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-500 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Date not available";
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <User className="w-8 h-8 text-gray-400 bg-gray-100 rounded-full p-1" />
            <div>
              <p className="font-medium text-gray-900">
                {review.user?.name || "Anonymous"}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(review.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {renderStars(review.rating)}
          <span className="ml-1 text-sm text-gray-600">({review.rating})</span>
        </div>
      </div>

      {showEventInfo && review.event && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            Event: <span className="font-medium">{review.event.title}</span>
          </p>
        </div>
      )}

      <p className="text-gray-700 leading-relaxed">{review.comment}</p>

      {review.response && (
        <div className="mt-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-sm font-medium text-blue-800 mb-1">
            Response from Organizer
          </p>
          <p className="text-sm text-blue-700">{review.response}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
