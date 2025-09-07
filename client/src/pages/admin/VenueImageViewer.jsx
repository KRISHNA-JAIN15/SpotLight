import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";

const VenueImageViewer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get image data from location state
  const { imageUrl, imageName, imageCaption, venueName } = location.state || {};

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `${venueName || "venue"}-${imageName || "image"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenInNewTab = () => {
    if (imageUrl) {
      window.open(imageUrl, "_blank");
    }
  };

  if (!imageUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No image data found</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {venueName || "Venue"} - {imageName || "Image"}
                </h1>
                {imageCaption && (
                  <p className="text-sm text-gray-600 mt-1">"{imageCaption}"</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Display */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="max-w-full max-h-full">
          <img
            src={imageUrl}
            alt={`${venueName || "Venue"} - ${imageName || "Image"}`}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              e.target.src = "/placeholder-image.png"; // fallback image
            }}
          />
        </div>
      </div>

      {/* Image Info */}
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg max-w-md">
        <p className="text-sm font-medium">
          {venueName || "Venue"} - {imageName || "Image"}
        </p>
        {imageCaption && (
          <p className="text-xs text-gray-300 mt-1">"{imageCaption}"</p>
        )}
      </div>
    </div>
  );
};

export default VenueImageViewer;
