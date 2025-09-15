import React, { useState } from "react";
import { Star, Send } from "lucide-react";

const ReviewForm = ({ eventId, onSubmit, isLoading }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please provide a rating");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Please provide a comment with at least 10 characters");
      return;
    }

    try {
      await onSubmit({
        eventId,
        rating,
        comment: comment.trim(),
      });

      // Reset form
      setRating(0);
      setComment("");
      setHoveredRating(0);
    } catch (error) {
      setError(error.message || "Failed to submit review");
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, i) => {
      const starValue = i + 1;
      return (
        <button
          key={i}
          type="button"
          className={`w-8 h-8 transition-colors duration-150 ${
            (hoveredRating || rating) >= starValue
              ? "text-yellow-500"
              : "text-gray-300 hover:text-yellow-400"
          }`}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          <Star className="w-full h-full fill-current" />
        </button>
      );
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Write a Review
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {renderStars()}
            <span className="ml-2 text-sm text-gray-600">
              {rating > 0 && (
                <span>
                  {rating} star{rating !== 1 ? "s" : ""}
                </span>
              )}
            </span>
          </div>
        </div>

        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your Review *
          </label>
          <textarea
            id="comment"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your experience about this event..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500">
              Minimum 10 characters required
            </p>
            <p className="text-sm text-gray-500">{comment.length}/1000</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || rating === 0 || comment.trim().length < 10}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
