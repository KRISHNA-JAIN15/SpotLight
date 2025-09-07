import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { User, Phone, Calendar, MapPin, Heart, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  getIndianStates,
  getCitiesForState,
  validateLocation,
} from "../utils/locationValidation";

// Validation schema with custom location validation - dynamic based on user type
const getProfileSchema = (userType) => {
  const baseSchema = {
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
  };

  // Only add preferences validation for regular users
  if (userType !== "event_manager") {
    baseSchema.preferences = yup.object({
      categories: yup
        .array()
        .min(1, "Please select at least one interest")
        .required("Please select your interests"),
      radius: yup
        .number()
        .min(1, "Radius must be at least 1 km")
        .max(100, "Radius cannot exceed 100 km")
        .required("Search radius is required"),
    });
  }

  return yup.object(baseSchema);
};

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

const CompleteProfilePage = () => {
  const {
    updateProfile,
    isLoading,
    user,
    isAuthenticated,
    requiresProfileCompletion,
  } = useAuth();

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  const [locationErrors, setLocationErrors] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(getProfileSchema(user?.type)),
    mode: "onBlur", // Only validate when user leaves field
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      location: {
        address: user?.location?.address || "",
        city: user?.location?.city || "",
        state: user?.location?.state || "",
        country: "India", // Fixed to India
      },
      ...(user?.type !== "event_manager" && {
        preferences: {
          radius: user?.preferences?.radius || 10,
          categories: user?.preferences?.categories || [],
        },
      }),
    },
  });

  // Watch for state changes to update available cities
  const watchedState = watch("location.state");

  useEffect(() => {
    if (watchedState && watchedState !== selectedState) {
      setSelectedState(watchedState);
      const cities = getCitiesForState(watchedState);
      setAvailableCities(cities);

      // Clear city selection when state changes
      setValue("location.city", "");
    }
  }, [watchedState, selectedState, setValue]);

  // Initialize cities if user has existing state
  useEffect(() => {
    if (user?.location?.state) {
      const cities = getCitiesForState(user.location.state);
      setAvailableCities(cities);
      setSelectedState(user.location.state);
    }
  }, [user]);

  // Initialize selected categories only for regular users
  useEffect(() => {
    if (user?.preferences?.categories && user?.type !== "event_manager") {
      setSelectedCategories(user.preferences.categories);
    }
  }, [user]);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if profile is already completed
  if (!requiresProfileCompletion && user?.isProfileCompleted) {
    if (user?.type === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (user?.type === "event_manager") {
      return <Navigate to="/event-manager/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleCategoryToggle = (categoryId) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelected);
    setValue("preferences.categories", newSelected);
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

        // Set form errors
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
      };

      // Only add preferences for regular users
      if (user?.type !== "event_manager") {
        profileData.preferences = {
          categories: selectedCategories,
          radius: parseInt(data.preferences?.radius || 10),
        };
      }

      await updateProfile(profileData);
      toast.success(
        "Profile completed successfully! Welcome to Spotlight Events!"
      );

      // Redirect to appropriate dashboard after successful profile completion
      setTimeout(() => {
        if (user?.type === "admin") {
          window.location.href = "/admin";
        } else if (user?.type === "event_manager") {
          window.location.href = "/event-manager/dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                Complete Your Profile
              </h2>
              <p className="mt-2 text-gray-600">
                {user?.type === "event_manager"
                  ? "Set up your event manager profile to start creating venues and events"
                  : "Help us personalize your experience by completing your profile"}
              </p>
            </div>{" "}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      {...register("name")}
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      {...register("phone")}
                      type="tel"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      {...register("dateOfBirth")}
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>

                  {/* Only show search radius for regular users */}
                  {user?.type !== "event_manager" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Search Radius (km)
                      </label>
                      <input
                        {...register("preferences.radius")}
                        type="number"
                        min="1"
                        max="100"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.preferences?.radius && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.preferences.radius.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Bio (Optional)
                  </label>
                  <textarea
                    {...register("bio")}
                    rows={3}
                    maxLength={500}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us a bit about yourself..."
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.bio.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      {...register("location.address")}
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Street address"
                    />
                    {errors.location?.address && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.location.address.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("location.state")}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700">
                      City <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register("location.city")}
                      disabled={!selectedState}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {selectedState ? "Select City" : "First select a state"}
                      </option>
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    {(errors.location?.city || locationErrors.city) && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.location?.city?.message || locationErrors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <input
                      {...register("location.country")}
                      type="text"
                      value="India"
                      readOnly
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    />
                    {(errors.location?.country || locationErrors.country) && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.location?.country?.message ||
                          locationErrors.country}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Interests - Only for regular users */}
              {user?.type !== "event_manager" && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Your Interests
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select the types of events you're interested in:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        <div className="text-lg mb-1">{category.icon}</div>
                        <div className="text-sm font-medium">
                          {category.label}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.preferences?.categories && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.preferences.categories.message}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" text="" />
                  ) : (
                    "Complete Profile"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
