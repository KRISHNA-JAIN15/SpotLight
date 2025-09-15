import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Review API endpoints
export const reviewAPI = {
  // Create a new review
  createReview: (reviewData) => api.post("/reviews", reviewData),

  // Get reviews for a specific event
  getEventReviews: (eventId) => api.get(`/reviews/event/${eventId}`),

  // Get top reviews for a venue
  getVenueTopReviews: (venueId) => api.get(`/reviews/venue/${venueId}/top`),

  // Update a review (for venue responses)
  updateReview: (reviewId, updateData) =>
    api.put(`/reviews/${reviewId}`, updateData),

  // Delete a review
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

// Event API endpoints
export const eventAPI = {
  // Get all events
  getAllEvents: () => api.get("/events"),

  // Get event by ID
  getEventById: (eventId) => api.get(`/events/${eventId}`),

  // Create event
  createEvent: (eventData) => api.post("/events", eventData),

  // Update event
  updateEvent: (eventId, eventData) => api.put(`/events/${eventId}`, eventData),

  // Delete event
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`),

  // Get events by user
  getEventsByUser: (userId) => api.get(`/events/user/${userId}`),
};

// Venue API endpoints
export const venueAPI = {
  // Get all venues
  getAllVenues: () => api.get("/venues"),

  // Get venue by ID
  getVenueById: (venueId) => api.get(`/venues/${venueId}`),

  // Create venue
  createVenue: (venueData) => api.post("/venues", venueData),

  // Update venue
  updateVenue: (venueId, venueData) => api.put(`/venues/${venueId}`, venueData),

  // Delete venue
  deleteVenue: (venueId) => api.delete(`/venues/${venueId}`),
};

// User API endpoints
export const userAPI = {
  // Get user profile
  getProfile: () => api.get("/users/profile"),

  // Update user profile
  updateProfile: (profileData) => api.put("/users/profile", profileData),

  // Get user by ID
  getUserById: (userId) => api.get(`/users/${userId}`),
};

// Auth API endpoints
export const authAPI = {
  // Login
  login: (credentials) => api.post("/auth/login", credentials),

  // Register
  register: (userData) => api.post("/auth/register", userData),

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    return Promise.resolve();
  },

  // Verify token
  verifyToken: () => api.get("/auth/verify"),
};

// Ticket API endpoints
export const ticketAPI = {
  // Purchase tickets
  purchaseTickets: (purchaseData) =>
    api.post("/tickets/purchase", purchaseData),

  // Get user tickets
  getUserTickets: () => api.get("/tickets/user"),

  // Get ticket by ID
  getTicketById: (ticketId) => api.get(`/tickets/${ticketId}`),

  // Validate ticket
  validateTicket: (ticketId) => api.post(`/tickets/${ticketId}/validate`),
};

export default api;
