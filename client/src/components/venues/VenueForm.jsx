import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import toast from "react-hot-toast";
import {
  MapPin,
  Upload,
  X,
  Phone,
  Mail,
  Globe,
  Users,
  Building,
  Navigation,
} from "lucide-react";
import {
  getIndianStates,
  getCitiesForState,
  validateLocation,
} from "../../utils/locationValidation";
import CloudinaryUpload from "../CloudinaryUpload";

const venueSchema = yup.object({
  name: yup
    .string()
    .required("Venue name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  description: yup
    .string()
    .max(1000, "Description must not exceed 1000 characters"),
  address: yup.object({
    street: yup.string(),
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    country: yup.string().required("Country is required"),
    pincode: yup.string().matches(/^\d{6}$/, "Pincode must be 6 digits"),
  }),
  contact: yup.object({
    phone: yup
      .string()
      .required("Phone number is required")
      .matches(/^[+]?[\d\s-()]+$/, "Please enter a valid phone number"),
    email: yup.string().email("Please enter a valid email address"),
    website: yup.string().url("Please enter a valid website URL"),
  }),
  capacity: yup
    .number()
    .required("Capacity is required")
    .min(1, "Capacity must be at least 1")
    .integer("Capacity must be a whole number"),
  venueType: yup
    .string()
    .required("Please select a venue type")
    .oneOf([
      "auditorium",
      "stadium",
      "conference_hall",
      "outdoor_space",
      "club",
      "restaurant",
      "theater",
      "arena",
      "park",
      "gallery",
      "other",
    ]),
  amenities: yup.array().of(yup.string()),
  images: yup.array().of(
    yup.object({
      url: yup.string().url("Please enter a valid image URL"),
      caption: yup.string().max(200, "Caption must not exceed 200 characters"),
      isPrimary: yup.boolean(),
    })
  ),
});

const venueTypes = [
  { value: "auditorium", label: "Auditorium" },
  { value: "stadium", label: "Stadium" },
  { value: "conference_hall", label: "Conference Hall" },
  { value: "outdoor_space", label: "Outdoor Space" },
  { value: "club", label: "Club" },
  { value: "restaurant", label: "Restaurant" },
  { value: "theater", label: "Theater" },
  { value: "arena", label: "Arena" },
  { value: "park", label: "Park" },
  { value: "gallery", label: "Gallery" },
  { value: "other", label: "Other" },
];

const amenitiesList = [
  { value: "parking", label: "Parking" },
  { value: "wifi", label: "WiFi" },
  { value: "ac", label: "Air Conditioning" },
  { value: "sound_system", label: "Sound System" },
  { value: "projector", label: "Projector" },
  { value: "catering", label: "Catering" },
  { value: "security", label: "Security" },
  { value: "accessibility", label: "Accessibility" },
  { value: "restrooms", label: "Restrooms" },
  { value: "bar", label: "Bar" },
  { value: "stage", label: "Stage" },
  { value: "lighting", label: "Lighting" },
];

const VenueForm = ({ onSubmit, initialData = null, isLoading = false }) => {
  const [selectedAmenities, setSelectedAmenities] = useState(
    initialData?.amenities || []
  );
  const [coordinates, setCoordinates] = useState(
    initialData?.location?.coordinates || null
  );
  const [geoLoading, setGeoLoading] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedState, setSelectedState] = useState(
    initialData?.address?.state || ""
  );
  const [uploadingStates, setUploadingStates] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
  } = useForm({
    resolver: yupResolver(venueSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      venueType: "",
      capacity: "",
      address: {
        street: "",
        city: "",
        state: "",
        country: "India",
        pincode: "",
      },
      contact: {
        phone: "",
        email: "",
        website: "",
      },
      amenities: [],
      images: [{ url: "", caption: "", isPrimary: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "images",
  });

  // Geocoding function
  const geocodeAddress = async (
    address,
    city,
    state,
    pincode,
    country = "India"
  ) => {
    if (!address && !city && !state) {
      toast.error("Please provide at least city or state information");
      return null;
    }

    setGeoLoading(true);
    try {
      const response = await axios.post(
        "/auth/geocode",
        {
          address,
          city,
          state,
          country,
          pincode,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        const { coordinates: coords } = response.data.data;
        setCoordinates(coords); // [longitude, latitude]
        toast.success("Address geocoded successfully!");
        return coords;
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

  // Handle geocoding button click
  const handleGeocodeClick = async () => {
    const addressData = watch("address");
    await geocodeAddress(
      addressData.street,
      addressData.city,
      addressData.state,
      addressData.pincode,
      addressData.country
    );
  };

  // Initialize cities when component mounts or when editing existing venue
  useEffect(() => {
    if (initialData && initialData.address?.state) {
      const cities = getCitiesForState(initialData.address.state);
      setAvailableCities(cities);
      setSelectedState(initialData.address.state);
    }
  }, [initialData]);

  // Watch for state changes and update available cities
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "address.state") {
        const watchedState = value.address?.state;
        if (watchedState) {
          const cities = getCitiesForState(watchedState);
          setAvailableCities(cities);
          setSelectedState(watchedState);
          // Clear city selection when state changes
          setValue("address.city", "");
        } else {
          setAvailableCities([]);
          setSelectedState("");
          setValue("address.city", "");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  const handleAmenityToggle = (amenityValue) => {
    const newAmenities = selectedAmenities.includes(amenityValue)
      ? selectedAmenities.filter((a) => a !== amenityValue)
      : [...selectedAmenities, amenityValue];

    setSelectedAmenities(newAmenities);
    setValue("amenities", newAmenities);
  };

  // Image upload handlers
  const handleImageUpload = (index, url, isUploading) => {
    if (isUploading) {
      setUploadingStates((prev) => ({ ...prev, [index]: true }));
    } else {
      setUploadingStates((prev) => ({ ...prev, [index]: false }));
      if (url) {
        setValue(`images.${index}.url`, url);
      }
    }
  };

  const handleImageRemove = (index) => {
    setValue(`images.${index}.url`, "");
    setUploadingStates((prev) => ({ ...prev, [index]: false }));
  };

  const onFormSubmit = (data) => {
    // Validate coordinates
    if (!coordinates || coordinates.length !== 2) {
      toast.error("Please geocode the address to get coordinates");
      return;
    }

    const formData = {
      ...data,
      location: {
        coordinates: coordinates, // [longitude, latitude]
        type: "Point",
      },
      amenities: selectedAmenities,
      // Filter out empty images
      images: data.images.filter((img) => img.url.trim() !== ""),
    };
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Building className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? "Edit Venue" : "Add New Venue"}
            </h2>
            <p className="text-gray-600">
              {initialData
                ? "Update your venue information"
                : "Create a new venue listing that requires admin approval"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter venue name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("venueType")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select venue type</option>
                {venueTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.venueType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.venueType.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  {...register("capacity", { valueAsNumber: true })}
                  min="1"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Maximum capacity"
                />
              </div>
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.capacity.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your venue (facilities, atmosphere, special features, etc.)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Address & Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                {...register("address.street")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Building number, street name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <select
                {...register("address.state")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select State</option>
                {getIndianStates().map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.address?.state && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.state.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <select
                {...register("address.city")}
                disabled={!selectedState}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              {errors.address?.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                {...register("address.pincode")}
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="6-digit pincode"
              />
              {errors.address?.pincode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.address.pincode.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("address.country")}
                value="India"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Venue Coordinates <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeocodeClick}
                  disabled={geoLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  {geoLoading ? "Getting Location..." : "Get Coordinates"}
                </button>
              </div>

              {geoLoading && (
                <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-blue-700">
                    Fetching coordinates for your venue location...
                  </p>
                </div>
              )}

              {!geoLoading && !coordinates && (
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Fill in the address fields above and click "Get Coordinates"
                    to fetch venue location
                  </p>
                </div>
              )}

              {!geoLoading && coordinates && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Location Coordinates Found
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Latitude: {coordinates[1]?.toFixed(6)}, Longitude:{" "}
                    {coordinates[0]?.toFixed(6)}
                  </p>
                  <button
                    type="button"
                    onClick={handleGeocodeClick}
                    disabled={geoLoading}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Update Coordinates
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  {...register("contact.phone")}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Venue contact number"
                />
              </div>
              {errors.contact?.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contact.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  {...register("contact.email")}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="venue@example.com"
                />
              </div>
              {errors.contact?.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contact.email.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  {...register("contact.website")}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://venuename.com"
                />
              </div>
              {errors.contact?.website && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contact.website.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Amenities & Facilities
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select all amenities available at your venue:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {amenitiesList.map((amenity) => (
              <button
                key={amenity.value}
                type="button"
                onClick={() => handleAmenityToggle(amenity.value)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedAmenities.includes(amenity.value)
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium">{amenity.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Venue Images
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload images to showcase your venue. The first image will be used
            as the primary image. You can upload up to 5 images.
          </p>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-700">
                  Image {index + 1} {index === 0 && "(Primary)"}
                </h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                    title="Remove this image slot"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <CloudinaryUpload
                    onUpload={(url, isUploading) =>
                      handleImageUpload(index, url, isUploading)
                    }
                    onRemove={() => handleImageRemove(index)}
                    currentUrl={watch(`images.${index}.url`) || ""}
                    caption={watch(`images.${index}.caption`) || ""}
                    isUploading={uploadingStates[index] || false}
                  />

                  {/* Hidden input to maintain form compatibility */}
                  <input {...register(`images.${index}.url`)} type="hidden" />

                  {errors.images?.[index]?.url && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <X className="h-4 w-4 mr-1" />
                      {errors.images[index].url.message}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caption
                  </label>
                  <textarea
                    {...register(`images.${index}.caption`)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe this image (optional)"
                  />
                  {errors.images?.[index]?.caption && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.images[index].caption.message}
                    </p>
                  )}

                  {/* Image tips */}
                  <div className="mt-3 text-xs text-gray-500">
                    <p className="font-medium">Tips for better images:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Use high-quality, well-lit photos</li>
                      <li>• Show different angles of your venue</li>
                      <li>• Include key amenities and features</li>
                      <li>• Ensure images are clear and professional</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => append({ url: "", caption: "", isPrimary: false })}
              disabled={fields.length >= 5}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Another Image{" "}
              {fields.length >= 5 ? "(Max 5)" : `(${fields.length}/5)`}
            </button>

            {fields.length > 1 && (
              <p className="text-sm text-gray-500 flex items-center">
                💡 Tip: Drag images to reorder them (first image will be the
                main photo)
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? "Saving..."
                : initialData
                ? "Update Venue"
                : "Create Venue"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VenueForm;
