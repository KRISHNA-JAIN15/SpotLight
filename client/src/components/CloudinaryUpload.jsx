import React, { useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadToCloudinary, testCloudinaryConfig } from "../utils/cloudinary";

const CloudinaryUpload = ({
  onUpload,
  onRemove,
  currentUrl = "",
  caption = "",
  isUploading = false,
}) => {
  const [uploadError, setUploadError] = useState("");

  // Test Cloudinary configuration on component mount
  useEffect(() => {
    const testConfig = async () => {
      try {
        await testCloudinaryConfig();
      } catch (error) {
        console.error("Cloudinary configuration test failed:", error);
        setUploadError("Configuration error: " + error.message);
      }
    };
    testConfig();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be less than 10MB");
      return;
    }

    setUploadError("");

    try {
      onUpload(null, true); // Set uploading state

      const result = await uploadToCloudinary(file);

      if (result.success) {
        // Call onUpload with the secure URL
        onUpload(result.url, false);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error.message || "Failed to upload image. Please try again."
      );
      onUpload(null, false);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-3">
      {!currentUrl ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="image-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload"
            className={`cursor-pointer flex flex-col items-center space-y-2 ${
              isUploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <p className="text-sm text-blue-600 font-medium">
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center text-green-700">
              <ImageIcon className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">
                Image uploaded successfully
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="replace-image-input"
              disabled={isUploading}
            />
            <label
              htmlFor="replace-image-input"
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
                isUploading ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Replace Image"}
            </label>

            <button
              type="button"
              onClick={() => window.open(currentUrl, "_blank")}
              className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Full Size
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-sm text-red-600 flex items-center">
          <X className="h-4 w-4 mr-1" />
          {uploadError}
        </p>
      )}
    </div>
  );
};

export default CloudinaryUpload;
