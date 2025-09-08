import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Calendar,
  MapPin,
  Upload,
  X,
  DollarSign,
  Users,
  Plus,
  Minus,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import CloudinaryUpload from "../CloudinaryUpload";

const eventSchema = yup.object({
  title: yup
    .string()
    .required("Event title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be less than 2000 characters"),
  category: yup.string().required("Event category is required"),
  type: yup.string().required("Event type is required"),
  venue: yup.string().required("Venue is required"),
  startDate: yup
    .date()
    .required("Start date is required")
    .min(
      new Date(Date.now() - 60000), // Allow dates within the last minute to account for timing issues
      "Start date must be in the future"
    ),
  endDate: yup
    .date()
    .required("End date is required")
    .min(yup.ref("startDate"), "End date must be after start date"),
  maxAttendees: yup
    .number()
    .required("Maximum attendees is required")
    .min(1, "Must allow at least 1 attendee")
    .max(100000, "Maximum attendees cannot exceed 100,000"),
  contactEmail: yup.string().email("Invalid email").optional(),
  contactPhone: yup.string().optional(),
});

const eventCategories = [
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "tech", label: "Technology" },
  { value: "food", label: "Food & Drink" },
  { value: "art", label: "Arts & Culture" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
  { value: "entertainment", label: "Entertainment" },
  { value: "health", label: "Health & Wellness" },
  { value: "other", label: "Other" },
];

const EventForm = ({ onSubmit, initialData = null, isLoading = false }) => {
  const [venues, setVenues] = useState([]);
  const [eventImages, setEventImages] = useState([
    { url: "", caption: "" },
    { url: "", caption: "" },
    { url: "", caption: "" },
  ]);
  const [uploadingStates, setUploadingStates] = useState({});
  const [tags, setTags] = useState(
    (initialData?.event || initialData)?.tags || []
  );
  const [newTag, setNewTag] = useState("");
  const [venuesLoading, setVenuesLoading] = useState(true);

  // State for managing ticket tiers
  const [ticketTiers, setTicketTiers] = useState([
    {
      id: 1,
      type: "General",
      price: "",
      quantity: "",
      description: "",
      isActive: true,
    },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      type: "",
      venue: "",
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16), // Tomorrow
      endDate: new Date(Date.now() + 25 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16), // Tomorrow + 1 hour
      maxAttendees: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  const eventType = watch("type");
  const selectedVenue = watch("venue");

  useEffect(() => {
    fetchApprovedVenues();
  }, []);

  // Reset ticket tiers when event type changes
  useEffect(() => {
    if (eventType === "paid" && ticketTiers.length === 0) {
      setTicketTiers([
        {
          id: 1,
          type: "General",
          price: "",
          quantity: "",
          description: "",
          isActive: true,
        },
      ]);
    } else if (eventType === "free") {
      setTicketTiers([]);
    }
  }, [eventType]);

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      console.log("Populating form with initialData:", initialData);

      // Handle nested event data structure
      const eventData = initialData.event || initialData;
      console.log("Using eventData:", eventData);

      // Set form field values
      Object.keys(eventData).forEach((key) => {
        if (key === "dateTime") {
          // Handle date formatting for edit mode
          setValue(
            "startDate",
            new Date(eventData.dateTime.startDate).toISOString().slice(0, 16)
          );
          setValue(
            "endDate",
            new Date(eventData.dateTime.endDate).toISOString().slice(0, 16)
          );
        } else if (key === "pricing") {
          // Handle pricing data and capacity
          setValue("type", eventData.pricing.isFree ? "free" : "paid");
          setValue("maxAttendees", eventData.pricing.totalCapacity);

          // Handle ticket tiers for paid events
          if (!eventData.pricing.isFree) {
            if (
              eventData.pricing.tickets &&
              eventData.pricing.tickets.length > 0
            ) {
              // Load existing ticket tiers
              const formattedTiers = eventData.pricing.tickets.map(
                (ticket, index) => ({
                  id: index + 1,
                  type: ticket.type,
                  price: ticket.price.toString(),
                  quantity: ticket.quantity.total.toString(),
                  description: ticket.description || "",
                  isActive: ticket.isActive !== false,
                })
              );
              setTicketTiers(formattedTiers);
            } else {
              // For paid events with no existing tickets, create a default tier
              console.log(
                "Creating default tier for paid event with no tickets"
              );
              setTicketTiers([
                {
                  id: 1,
                  type: "General",
                  price: "",
                  quantity: eventData.pricing.totalCapacity.toString(),
                  description: "",
                  isActive: true,
                },
              ]);
            }
          } else {
            // Free event - no tiers needed
            setTicketTiers([]);
          }
        } else if (key === "images") {
          // Handle images
          const imageData = [...eventImages];
          eventData.images.forEach((img, index) => {
            if (index < imageData.length) {
              imageData[index] = { url: img.url, caption: img.caption || "" };
            }
          });
          setEventImages(imageData);
        } else if (key === "venue") {
          // Handle venue (use the venue ID)
          setValue("venue", eventData.venue._id || eventData.venue);
        } else if (key === "contactInfo") {
          // Handle contact info safely
          if (eventData.contactInfo) {
            setValue("contactEmail", eventData.contactInfo.email || "");
            setValue("contactPhone", eventData.contactInfo.phone || "");
          }
        } else if (key === "tags") {
          // Tags are already handled in state initialization
          setTags(eventData.tags || []);
        } else if (
          key !== "pricing" &&
          key !== "dateTime" &&
          key !== "images" &&
          key !== "venue" &&
          key !== "contactInfo" &&
          key !== "tags" &&
          key !== "_id" &&
          key !== "organizer" &&
          key !== "createdAt" &&
          key !== "updatedAt" &&
          key !== "__v" &&
          key !== "attendees" &&
          key !== "reviews" &&
          key !== "venueDetails" &&
          key !== "organizerDetails"
        ) {
          // Handle other fields directly (excluding already processed ones and DB-specific fields)
          setValue(key, eventData[key]);
        }
      });
    }
  }, [initialData, setValue]);

  const fetchApprovedVenues = async () => {
    try {
      setVenuesLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/venues`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            status: "approved",
          },
        }
      );
      setVenues(response.data.data.venues || []);
    } catch (error) {
      console.error("Error fetching venues:", error);
    } finally {
      setVenuesLoading(false);
    }
  };

  const handleImageUpload = (index, url, isUploading) => {
    if (isUploading) {
      setUploadingStates((prev) => ({ ...prev, [index]: true }));
    } else {
      setUploadingStates((prev) => ({ ...prev, [index]: false }));
      if (url) {
        setEventImages((prev) =>
          prev.map((img, i) => (i === index ? { ...img, url } : img))
        );
      }
    }
  };

  const handleImageRemove = (index) => {
    setEventImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, url: "" } : img))
    );
    setUploadingStates((prev) => ({ ...prev, [index]: false }));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags((prev) => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // Ticket tier management functions
  const addTicketTier = () => {
    const newId = Math.max(...ticketTiers.map((t) => t.id), 0) + 1;
    setTicketTiers((prev) => [
      ...prev,
      {
        id: newId,
        type: "",
        price: "",
        quantity: "",
        description: "",
        isActive: true,
      },
    ]);
  };

  const removeTicketTier = (tierIdToRemove) => {
    if (ticketTiers.length > 1) {
      setTicketTiers((prev) =>
        prev.filter((tier) => tier.id !== tierIdToRemove)
      );
    }
  };

  const updateTicketTier = (tierId, field, value) => {
    setTicketTiers((prev) =>
      prev.map((tier) =>
        tier.id === tierId ? { ...tier, [field]: value } : tier
      )
    );
  };

  // Calculate total capacity from all ticket tiers
  const calculateTotalCapacity = () => {
    return ticketTiers.reduce((total, tier) => {
      const quantity = parseInt(tier.quantity) || 0;
      return total + quantity;
    }, 0);
  };

  // Validate ticket tier quantities against max attendees
  const validateTicketQuantities = (maxAttendees) => {
    const totalTicketCapacity = calculateTotalCapacity();
    const maxAttendeesNum = parseInt(maxAttendees) || 0;

    if (totalTicketCapacity > maxAttendeesNum) {
      return {
        isValid: false,
        message: `Total ticket quantity (${totalTicketCapacity}) exceeds maximum attendees (${maxAttendeesNum})`,
      };
    }

    return { isValid: true };
  };

  const getVenueCapacity = () => {
    const venue = venues.find((v) => v._id === selectedVenue);
    return venue?.capacity || null;
  };

  const onFormSubmit = (data) => {
    console.log("Form data received:", data);
    console.log("Start date from form:", data.startDate);
    console.log("End date from form:", data.endDate);

    // Validate dates before processing
    if (!data.startDate || !data.endDate) {
      toast.error("Please provide both start and end dates");
      return;
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (isNaN(startDate.getTime())) {
      toast.error("Invalid start date format");
      return;
    }

    if (isNaN(endDate.getTime())) {
      toast.error("Invalid end date format");
      return;
    }

    if (startDate >= endDate) {
      toast.error("End date must be after start date");
      return;
    }

    // Validate ticket quantities for paid events
    if (data.type === "paid") {
      const ticketValidation = validateTicketQuantities(data.maxAttendees);
      if (!ticketValidation.isValid) {
        toast.error(ticketValidation.message);
        return;
      }

      // Check if at least one valid ticket tier exists
      const validTiers = ticketTiers.filter(
        (tier) =>
          tier.type &&
          tier.price &&
          tier.quantity &&
          parseInt(tier.quantity) > 0
      );

      if (validTiers.length === 0) {
        toast.error(
          "Please add at least one valid ticket tier with name, price, and quantity"
        );
        return;
      }
    }

    console.log("Current time:", new Date().toISOString());
    console.log("Start date as Date object:", startDate);
    console.log("Start date ISO:", startDate.toISOString());

    // Filter out empty images and prepare the images array
    const validImages = eventImages
      .filter((img) => img.url.trim() !== "")
      .map((img) => ({
        url: img.url,
        caption: img.caption || "",
      }));

    // Prepare pricing data based on event type
    let pricingData;
    let totalCapacity = parseInt(data.maxAttendees) || 0;

    if (data.type === "free") {
      pricingData = {
        isFree: true,
        tickets: [],
        totalCapacity,
        soldTickets: 0,
        availableTickets: totalCapacity,
      };
    } else {
      // For paid events, use ticket tiers
      console.log("Processing ticket tiers:", ticketTiers);

      const validTickets = ticketTiers
        .filter((tier) => tier.type && tier.price && tier.quantity)
        .map((tier) => ({
          type: tier.type,
          price: parseFloat(tier.price),
          currency: "INR",
          quantity: {
            total: parseInt(tier.quantity),
            sold: 0,
            available: parseInt(tier.quantity),
          },
          description: tier.description || "",
          isActive: tier.isActive,
        }));

      console.log("Valid tickets after processing:", validTickets);

      // Calculate total capacity from ticket tiers
      totalCapacity = validTickets.reduce(
        (sum, ticket) => sum + ticket.quantity.total,
        0
      );

      pricingData = {
        isFree: false,
        tickets: validTickets,
        totalCapacity,
        soldTickets: 0,
        availableTickets: totalCapacity,
      };
    }

    console.log("Final pricing data:", pricingData);
    console.log("Ticket tiers state:", ticketTiers);

    const eventFormData = {
      ...data,
      dateTime: {
        startDate: data.startDate,
        endDate: data.endDate,
      },
      pricing: pricingData,
      tags,
      images: validImages,
    };

    // Remove the dot notation fields and individual date fields
    delete eventFormData["pricing.general"];
    delete eventFormData["pricing.vip"];
    delete eventFormData["pricing.premium"];
    delete eventFormData.startDate;
    delete eventFormData.endDate;

    console.log("Processed event data:", eventFormData);
    console.log("DateTime object being sent:", eventFormData.dateTime);
    console.log("Pricing object being sent:", eventFormData.pricing);
    onSubmit(eventFormData);
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {initialData ? "Edit Event" : "Create New Event"}
        </h2>
        <p className="text-gray-600">
          {initialData
            ? "Update your event information"
            : "Create a new event at one of your approved venues"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              {...register("title")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register("category")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {eventCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">
                {errors.category.message}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your event, what attendees can expect, and any special features"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Event Type and Venue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type *
            </label>
            <select
              {...register("type")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type</option>
              <option value="free">Free Event</option>
              <option value="paid">Paid Event</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue *
            </label>
            <select
              {...register("venue")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={venuesLoading}
            >
              <option value="">
                {venuesLoading ? "Loading venues..." : "Select venue"}
              </option>
              {venues.map((venue) => (
                <option key={venue._id} value={venue._id}>
                  {venue.name} - {venue.city}, {venue.state} (Capacity:{" "}
                  {venue.capacity})
                </option>
              ))}
            </select>
            {errors.venue && (
              <p className="mt-1 text-sm text-red-600">
                {errors.venue.message}
              </p>
            )}
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              {...register("startDate")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.startDate.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              {...register("endDate")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">
                {errors.endDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Attendees */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Attendees *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="number"
              {...register("maxAttendees")}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Maximum number of attendees"
            />
          </div>
          {getVenueCapacity() && (
            <p className="mt-1 text-sm text-gray-500">
              Venue capacity: {getVenueCapacity()} people
            </p>
          )}
          {errors.maxAttendees && (
            <p className="mt-1 text-sm text-red-600">
              {errors.maxAttendees.message}
            </p>
          )}
        </div>

        {/* Pricing - Only show if paid event */}
        {eventType === "paid" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Ticket Pricing & Tiers
              </h3>
              <button
                type="button"
                onClick={addTicketTier}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tier
              </button>
            </div>

            {/* Dynamic Ticket Tiers */}
            <div className="space-y-4">
              {ticketTiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Ticket Tier {index + 1}
                    </h4>
                    {ticketTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketTier(tier.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tier Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tier Name *
                      </label>
                      <input
                        type="text"
                        value={tier.type}
                        onChange={(e) =>
                          updateTicketTier(tier.id, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., General, VIP, Premium"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tier.price}
                          onChange={(e) =>
                            updateTicketTier(tier.id, "price", e.target.value)
                          }
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          min="1"
                          value={tier.quantity}
                          onChange={(e) =>
                            updateTicketTier(
                              tier.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="50"
                        />
                      </div>
                    </div>

                    {/* Status Toggle */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div className="flex items-center pt-2">
                        <input
                          type="checkbox"
                          checked={tier.isActive}
                          onChange={(e) =>
                            updateTicketTier(
                              tier.id,
                              "isActive",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={tier.description}
                      onChange={(e) =>
                        updateTicketTier(tier.id, "description", e.target.value)
                      }
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe what's included in this tier..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Capacity Summary */}
            <div
              className={`p-4 rounded-lg ${
                calculateTotalCapacity() > parseInt(watch("maxAttendees")) || 0
                  ? "bg-red-50 border border-red-200"
                  : "bg-blue-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-medium ${
                    calculateTotalCapacity() >
                      parseInt(watch("maxAttendees")) || 0
                      ? "text-red-900"
                      : "text-blue-900"
                  }`}
                >
                  Total Ticket Capacity:
                </span>
                <span
                  className={`text-lg font-bold ${
                    calculateTotalCapacity() >
                      parseInt(watch("maxAttendees")) || 0
                      ? "text-red-900"
                      : "text-blue-900"
                  }`}
                >
                  {calculateTotalCapacity()} people
                </span>
              </div>

              {/* Max Attendees Validation */}
              {watch("maxAttendees") && (
                <div
                  className={`text-xs mt-1 ${
                    calculateTotalCapacity() > parseInt(watch("maxAttendees"))
                      ? "text-red-700"
                      : "text-blue-700"
                  }`}
                >
                  Maximum attendees set: {watch("maxAttendees")} people
                  {calculateTotalCapacity() >
                    parseInt(watch("maxAttendees")) && (
                    <span className="block text-red-600 font-medium mt-1">
                      ⚠️ Ticket capacity ({calculateTotalCapacity()}) exceeds
                      maximum attendees ({watch("maxAttendees")})!
                    </span>
                  )}
                </div>
              )}

              {/* Venue Capacity Validation */}
              {getVenueCapacity() && (
                <p className="text-xs text-blue-700 mt-1">
                  Venue capacity: {getVenueCapacity()} people
                  {calculateTotalCapacity() > getVenueCapacity() && (
                    <span className="text-red-600 ml-2">
                      ⚠️ Exceeds venue capacity!
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              {...register("contactEmail")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="contact@event.com"
            />
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-red-600">
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              {...register("contactPhone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Phone number"
            />
            {errors.contactPhone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.contactPhone.message}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a tag (e.g., live-music, networking)"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Event Images
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload images to showcase your event. You can upload up to 3 images.
          </p>

          <div className="space-y-6">
            {eventImages.map((image, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Image {index + 1}{" "}
                      {index === 0 ? "(Primary)" : "(Optional)"}
                    </label>
                    <CloudinaryUpload
                      onUpload={(url, isUploading) =>
                        handleImageUpload(index, url, isUploading)
                      }
                      onRemove={() => handleImageRemove(index)}
                      currentUrl={image.url}
                      caption={image.caption}
                      isUploading={uploadingStates[index] || false}
                    />
                  </div>

                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Caption
                    </label>
                    <textarea
                      value={image.caption}
                      onChange={(e) => {
                        const newCaption = e.target.value;
                        setEventImages((prev) =>
                          prev.map((img, i) =>
                            i === index ? { ...img, caption: newCaption } : img
                          )
                        );
                      }}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Describe this image (optional)"
                    />

                    {/* Image tips */}
                    <div className="mt-3 text-xs text-gray-500">
                      <p className="font-medium">Tips for better images:</p>
                      <ul className="mt-1 space-y-1">
                        <li>• Use high-quality, well-lit photos</li>
                        <li>• Show different aspects of your event</li>
                        <li>• Include key features and atmosphere</li>
                        <li>• Ensure images are clear and professional</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Creating..."
              : initialData
              ? "Update Event"
              : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
