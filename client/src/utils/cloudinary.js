// Cloudinary configuration
// You need to set up these values in your Cloudinary dashboard

export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your-cloud-name",
  UPLOAD_PRESET:
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "your-upload-preset",
  API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY || "your-api-key",
};

// Test configuration function
export const testCloudinaryConfig = () => {
  console.log("Cloudinary Configuration Test:");
  console.log("Cloud Name:", CLOUDINARY_CONFIG.CLOUD_NAME);
  console.log("Upload Preset:", CLOUDINARY_CONFIG.UPLOAD_PRESET);
  console.log("API Key:", CLOUDINARY_CONFIG.API_KEY ? "Set" : "Not set");

  // Check if environment variables are loaded
  console.log("Environment variables:");
  console.log(
    "VITE_CLOUDINARY_CLOUD_NAME:",
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  );
  console.log(
    "VITE_CLOUDINARY_UPLOAD_PRESET:",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  if (CLOUDINARY_CONFIG.CLOUD_NAME === "your-cloud-name") {
    console.error("❌ Cloud name not configured properly");
    return false;
  }

  if (CLOUDINARY_CONFIG.UPLOAD_PRESET === "your-upload-preset") {
    console.error("❌ Upload preset not configured properly");
    return false;
  }

  console.log("✅ Configuration looks good");
  return true;
};

// Helper function to generate Cloudinary URLs with transformations
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = "auto",
    height = "auto",
    crop = "fill",
    quality = "auto",
    format = "auto",
  } = options;

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload`;
  const transformations = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;

  return `${baseUrl}/${transformations}/${publicId}`;
};

// Upload function for direct use
export const uploadToCloudinary = async (file) => {
  console.log("Starting upload with config:", {
    cloudName: CLOUDINARY_CONFIG.CLOUD_NAME,
    uploadPreset: CLOUDINARY_CONFIG.UPLOAD_PRESET,
    fileSize: file.size,
    fileType: file.type,
  });

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    console.log(
      "Upload response status:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      // Get the error details from Cloudinary
      let errorDetails;
      try {
        errorDetails = await response.json();
        console.error("Cloudinary error details:", errorDetails);
      } catch (parseError) {
        errorDetails = {
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      throw new Error(
        errorDetails.error?.message ||
          errorDetails.message ||
          `Upload failed with status ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Upload successful:", data.secure_url);

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      originalData: data,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
