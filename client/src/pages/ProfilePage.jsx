import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  User,
  Phone,
  Calendar,
  MapPin,
  Mail,
  Edit3,
  Save,
  X,
  Camera,
  Settings,
  Heart,
  Users,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import Navbar from "../components/Navbar";
import FinancialProfile from "../components/FinancialProfile";
import {
  getIndianStates,
  getCitiesForState,
  validateLocation,
} from "../utils/locationValidation";

// Validation schema for profile update
const profileUpdateSchema = yup.object({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^[+]?[\d\s-()]+$/, "Please enter a valid phone number"),
  dateOfBirth: yup
    .date()
    .required("Date of birth is required")
    .max(new Date(), "Date of birth cannot be in the future"),
  bio: yup.string().max(500, "Bio must not exceed 500 characters"),
  location: yup.object({
    address: yup.string().required("Address is required"),
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    country: yup.string().oneOf(["India"], "Country must be India"),
  }),
  preferences: yup.object({
    radius: yup
      .number()
      .min(1, "Radius must be at least 1 km")
      .max(100, "Radius cannot exceed 100 km")
      .required("Search radius is required"),
  }),
});

const categories = [
  { id: "music", label: "Music & Concerts", icon: "🎵" },
  { id: "sports", label: "Sports & Fitness", icon: "⚽" },
  { id: "tech", label: "Technology", icon: "💻" },
  { id: "food", label: "Food & Dining", icon: "🍕" },
  { id: "art", label: "Arts & Culture", icon: "🎨" },
  { id: "business", label: "Business & Networking", icon: "💼" },
  { id: "education", label: "Education & Learning", icon: "📚" },
  { id: "entertainment", label: "Entertainment", icon: "🎭" },
  { id: "health", label: "Health & Wellness", icon: "🏥" },
  { id: "other", label: "Other", icon: "🌟" },
];

const ProfilePage = () => {
  const { user, _isAuthenticated, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  const [locationErrors, setLocationErrors] = useState({});
  const [_profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [_refreshing, setRefreshing] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
    reset,
  } = useForm({
    resolver: yupResolver(profileUpdateSchema),
    mode: "onBlur",
  });

  // Watch for state changes to update available cities
  const watchedState = watch("location.state");

  // Add a function to refresh user data
  const _refreshUserData = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get("/auth/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("Refreshed user data:", response.data.data.user);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      toast.error("Failed to refresh profile data");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log("User data in ProfilePage:", user); // Debug log

      // Initialize form with user data
      reset({
        name: user.name || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        bio: user.bio || "",
        location: {
          address: user.location?.address || "",
          city: user.location?.city || "",
          state: user.location?.state || "",
          country: "India",
        },
        preferences: {
          radius: user.preferences?.radius || 10,
        },
      });

      // Set selected categories
      if (user.preferences?.categories) {
        setSelectedCategories(user.preferences.categories);
      }

      // Set selected state and available cities
      if (user.location?.state) {
        setSelectedState(user.location.state);
        const cities = getCitiesForState(user.location.state);
        setAvailableCities(cities);
      }

      // Set coordinates if available
      if (
        user.location?.coordinates &&
        user.location.coordinates.length === 2
      ) {
        setCoordinates({
          latitude: user.location.coordinates[1],
          longitude: user.location.coordinates[0],
        });
      }
    }
  }, [user, reset]);
  useEffect(() => {
    if (watchedState && watchedState !== selectedState) {
      setSelectedState(watchedState);
      const cities = getCitiesForState(watchedState);
      setAvailableCities(cities);

      // Clear city selection when state changes
      setValue("location.city", "");
    }
  }, [watchedState, selectedState, setValue]);

  const handleCategoryToggle = (categoryId) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelected);
  };

  const geocodeAddress = async (address, city, state, country = "India") => {
    try {
      setGeoLoading(true);
      const response = await axios.post(
        "/auth/geocode",
        {
          address,
          city,
          state,
          country,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const { latitude, longitude } = response.data.data;
        setCoordinates({ latitude, longitude });
        toast.success("Address geocoded successfully!");
        return { latitude, longitude };
      } else {
        toast.error("Could not find coordinates for this address");
        return null;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to geocode address");
      return null;
    } finally {
      setGeoLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Profile picture must be less than 5MB");
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Validate location before submitting
      const locationValidation = validateLocation(
        data.location.city,
        data.location.state,
        data.location.country
      );

      if (!locationValidation.isValid) {
        setLocationErrors(locationValidation.errors);
        Object.keys(locationValidation.errors).forEach((field) => {
          setError(`location.${field}`, {
            type: "manual",
            message: locationValidation.errors[field],
          });
        });
        toast.error("Please fix location errors before submitting");
        return;
      }

      // Clear location errors if validation passes
      setLocationErrors({});
      clearErrors(["location.city", "location.state", "location.country"]);

      // Structure the data properly
      const profileData = {
        name: data.name,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        bio: data.bio,
        location: {
          address: data.location.address,
          city: data.location.city,
          state: data.location.state,
          country: data.location.country,
        },
        preferences: {
          categories: selectedCategories,
          radius: parseInt(data.preferences.radius),
        },
      };

      // Try to geocode the address if location information is provided
      if (data.location.address || data.location.city || data.location.state) {
        try {
          const geoResult = await geocodeAddress(
            data.location.address,
            data.location.city,
            data.location.state,
            data.location.country
          );

          if (geoResult) {
            // Add coordinates to profile data
            profileData.location.coordinates = [
              geoResult.longitude,
              geoResult.latitude,
            ];
          }
        } catch (geoError) {
          console.error("Geocoding failed:", geoError);
          // Continue with profile update even if geocoding fails
          toast.warning(
            "Profile will be updated, but location coordinates could not be determined"
          );
        }
      }

      // If there's a profile picture, we would handle file upload here
      // For now, just update the profile data
      await updateProfile(profileData);

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfilePicture(null);
    setProfilePicturePreview(null);
    // Reset form to original user data
    if (user) {
      reset({
        name: user.name || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        bio: user.bio || "",
        location: {
          address: user.location?.address || "",
          city: user.location?.city || "",
          state: user.location?.state || "",
          country: "India",
        },
        preferences: {
          radius: user.preferences?.radius || 10,
        },
      });
      setSelectedCategories(user.preferences?.categories || []);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Redirect if not authenticated
  if (!_isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Debug Info - Remove in production
        {process.env.NODE_ENV === "development" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-medium text-yellow-800">Debug Info:</h3>
            <pre className="mt-2 text-xs text-yellow-700 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )} */}

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
          <div className="relative px-6 pb-6">
            {/* Profile Picture */}
            <div className="relative -mt-16 mb-4">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100">
                  {profilePicturePreview || user?.profilePicture ? (
                    <img
                      src={profilePicturePreview || user.profilePicture}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* User Info Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.name}
                </h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>{user?.email}</span>
                </div>
                {user?.location?.city && (
                  <div className="flex items-center mt-1 text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                      {user.location.city}, {user.location.state}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 md:mt-0">
                {!isEditing ? (
                  <div className="flex space-x-2">
                    {/* <button
                      onClick={refreshUserData}
                      disabled={refreshing}
                      className="inline-flex items-center px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors duration-200 disabled:opacity-50"
                    >
                      {refreshing ? "..." : "🔄"}
                    </button> */}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md transition-colors duration-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit(onSubmit)}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="small" text="" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="space-y-8">
          {/* Financial Profile - Only show for event managers */}
          {user?.type === "event_manager" && <FinancialProfile />}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Information */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Basic Information
                </h2>

                {isEditing ? (
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          {...register("name")}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          {...register("phone")}
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          {...register("dateOfBirth")}
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.dateOfBirth && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.dateOfBirth.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Radius (km)
                        </label>
                        <input
                          {...register("preferences.radius")}
                          type="number"
                          min="1"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.preferences?.radius && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.preferences.radius.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        {...register("bio")}
                        rows={4}
                        maxLength={500}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell us a bit about yourself..."
                      />
                      {errors.bio && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.bio.message}
                        </p>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Full Name
                        </label>
                        <p className="mt-1 text-gray-900">
                          {user?.name || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Phone Number
                        </label>
                        <p className="mt-1 text-gray-900">
                          {user?.phone || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Date of Birth
                        </label>
                        <p className="mt-1 text-gray-900">
                          {formatDate(user?.dateOfBirth)}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Search Radius
                        </label>
                        <p className="mt-1 text-gray-900">
                          {user?.preferences?.radius || 10} km
                        </p>
                      </div>
                    </div>

                    {user?.bio && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          Bio
                        </label>
                        <p className="mt-1 text-gray-900">{user.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Location Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Location
                </h2>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        {...register("location.address")}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Street address"
                      />
                      {errors.location?.address && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.location.address.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("location.state")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select State</option>
                          {getIndianStates().map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                        {(errors.location?.state || locationErrors.state) && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.location?.state?.message ||
                              locationErrors.state}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register("location.city")}
                          disabled={!selectedState}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {selectedState
                              ? "Select City"
                              : "First select a state"}
                          </option>
                          {availableCities.map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        {(errors.location?.city || locationErrors.city) && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.location?.city?.message ||
                              locationErrors.city}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        {...register("location.country")}
                        type="text"
                        value="India"
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    {/* Geocoding Button and Coordinates Display */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Location Coordinates
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const address = watch("location.address");
                            const city = watch("location.city");
                            const state = watch("location.state");
                            if (city && state) {
                              geocodeAddress(address, city, state);
                            } else {
                              toast.error(
                                "Please fill in city and state first"
                              );
                            }
                          }}
                          disabled={geoLoading}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors duration-200 disabled:opacity-50"
                        >
                          {geoLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              Getting...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3 mr-1" />
                              Get Coordinates
                            </>
                          )}
                        </button>
                      </div>
                      {coordinates ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center text-green-800 text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>
                              Lat: {coordinates.latitude.toFixed(6)}, Lng:{" "}
                              {coordinates.longitude.toFixed(6)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>No coordinates available</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Address
                      </label>
                      <p className="mt-1 text-gray-900">
                        {user?.location?.address || "Not specified"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          City
                        </label>
                        <p className="mt-1 text-gray-900">
                          {user?.location?.city || "Not specified"}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-500">
                          State
                        </label>
                        <p className="mt-1 text-gray-900">
                          {user?.location?.state || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Country
                      </label>
                      <p className="mt-1 text-gray-900">India</p>
                    </div>

                    {/* Coordinates Display in Read-only Mode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-500">
                        Location Coordinates
                      </label>
                      {user?.location?.coordinates &&
                      user.location.coordinates.length === 2 ? (
                        <div className="mt-1 bg-green-50 border border-green-200 rounded-md p-3">
                          <div className="flex items-center text-green-800 text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>
                              Lat: {user.location.coordinates[1].toFixed(6)},
                              Lng: {user.location.coordinates[0].toFixed(6)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 bg-gray-50 border border-gray-200 rounded-md p-3">
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>No coordinates available</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Interests */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Interests
                </h2>

                {isEditing ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Select the types of events you're interested in:
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryToggle(category.id)}
                          className={`p-3 rounded-lg border-2 text-left transition-colors ${
                            selectedCategories.includes(category.id)
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="text-lg mr-3">
                              {category.icon}
                            </span>
                            <span className="text-sm font-medium">
                              {category.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {user?.preferences?.categories?.length > 0 ? (
                      <div className="space-y-2">
                        {user.preferences.categories.map((categoryId) => {
                          const category = categories.find(
                            (c) => c.id === categoryId
                          );
                          return category ? (
                            <div
                              key={categoryId}
                              className="flex items-center p-2 bg-blue-50 rounded-lg"
                            >
                              <span className="text-lg mr-3">
                                {category.icon}
                              </span>
                              <span className="text-sm font-medium text-blue-700">
                                {category.label}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No interests selected
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Activity
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-sm text-gray-600">
                        Events Attended
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 text-red-600 mr-3" />
                      <span className="text-sm text-gray-600">
                        Liked Events
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-green-600 mr-3" />
                      <span className="text-sm text-gray-600">Following</span>
                    </div>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-600 mr-3" />
                      <span className="text-sm text-gray-600">Reviews</span>
                    </div>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
