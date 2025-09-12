import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import MoneyAnalysis from "../components/MoneyAnalysis";

const EventManagerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    venues: { total: 0, pending: 0, approved: 0 },
    events: { total: 0, active: 0, upcoming: 0 },
    attendees: 0,
    revenue: 0,
  });
  const [recentVenues, setRecentVenues] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [venuesResponse, eventsResponse, revenueResponse] =
        await Promise.all([
          // Fetch venues
          axios.get("/venues/my/venues", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          // Fetch events
          axios.get("/events/my-events", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          // Fetch revenue data
          axios
            .get("/revenue/manager-analytics", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            })
            .catch(() => ({
              data: { data: { summary: { monthlyRevenue: 0 } } },
            })), // Fallback if revenue endpoint fails
        ]);

      const venues = venuesResponse.data.data.venues || [];
      const events = eventsResponse.data.data.events || [];
      const revenueData = revenueResponse.data.data;

      // Calculate stats
      const venueStats = {
        total: venues.length,
        pending: venues.filter((v) => v.approvalStatus === "pending").length,
        approved: venues.filter((v) => v.approvalStatus === "approved").length,
      };

      const eventStats = {
        total: events.length,
        active: events.filter((e) => e.status === "active").length,
        upcoming: events.filter((e) => new Date(e.startDate) > new Date())
          .length,
      };

      const totalAttendees = events.reduce(
        (sum, event) => sum + (event.attendees?.length || 0),
        0
      );

      setStats({
        venues: venueStats,
        events: eventStats,
        attendees: totalAttendees,
        revenue: revenueData?.summary?.managerShareMonthly || 0, // Manager's share of monthly revenue
      });

      setRecentVenues(venues.slice(0, 3));
      setRecentEvents(events.slice(0, 3));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      approved: { color: "bg-green-100 text-green-800", text: "Approved" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rejected" },
      active: { color: "bg-green-100 text-green-800", text: "Active" },
      cancelled: { color: "bg-red-100 text-red-800", text: "Cancelled" },
    };

    const config = configs[status] || configs.pending;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your venues and events from your dashboard
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to="/add-venue"
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
          >
            <MapPin className="h-6 w-6" />
            <span className="text-lg font-medium">Add New Venue</span>
          </Link>
          <Link
            to="/add-event"
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg flex items-center justify-center space-x-3 transition-colors"
          >
            <Calendar className="h-6 w-6" />
            <span className="text-lg font-medium">Create New Event</span>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Venues
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.venues.total}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.venues.pending} pending approval
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Events
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.events.total}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.events.upcoming} upcoming
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Attendees
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.attendees}
                </p>
                <p className="text-xs text-gray-500">Across all events</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Your share (75%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "analytics"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Revenue Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                {/* Recent Items */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Venues */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Recent Venues
                        </h2>
                        <Link
                          to="/venues/manage"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View all →
                        </Link>
                      </div>
                    </div>
                    <div className="p-6">
                      {recentVenues.length === 0 ? (
                        <div className="text-center py-8">
                          <MapPin className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            No venues yet
                          </p>
                          <Link
                            to="/add-venue"
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Add your first venue →
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentVenues.map((venue) => (
                            <div
                              key={venue._id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">
                                  {venue.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {venue.city}, {venue.state}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(venue.approvalStatus)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Events */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Recent Events
                        </h2>
                        <Link
                          to="/my-events"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View all →
                        </Link>
                      </div>
                    </div>
                    <div className="p-6">
                      {recentEvents.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            No events yet
                          </p>
                          <Link
                            to="/add-event"
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Create your first event →
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {recentEvents.map((event) => (
                            <div
                              key={event._id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900">
                                  {event.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    event.startDate
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                  {event.attendees?.length || 0}/
                                  {event.maxAttendees}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "analytics" && <MoneyAnalysis />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventManagerDashboard;
