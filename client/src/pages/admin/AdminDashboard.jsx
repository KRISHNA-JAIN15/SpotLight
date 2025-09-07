import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";
import {
  Users,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  TrendingUp,
  UserCheck,
  UserX,
  Activity,
  Percent,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    totalEvents: 0,
    userBreakdown: {
      total: 0,
      active: 0,
      suspended: 0,
      admins: 0,
      eventManagers: 0,
      attendees: 0,
    },
    venueBreakdown: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      approvalRate: 0,
    },
    eventBreakdown: {
      total: 0,
      upcoming: 0,
      past: 0,
      active: 0,
    },
    recentActivity: {
      newUsers: 0,
      newVenues: 0,
      newEvents: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?.type !== "admin") {
      toast.error("Access denied. Admin only.");
      navigate("/");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    if (user?.type === "admin") {
      fetchStats();
    }
  }, [user]);

  if (!isAuthenticated || user?.type !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    // Main Overview Cards
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      link: "/admin/users",
      subtitle: `${stats.userBreakdown.active} active, ${stats.userBreakdown.suspended} suspended`,
    },
    {
      title: "Total Venues",
      value: stats.totalVenues,
      icon: Building,
      color: "bg-green-500",
      link: "/admin/venues",
      subtitle: `${stats.venueBreakdown.approvalRate}% approval rate`,
    },
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "bg-purple-500",
      link: "/admin/events",
      subtitle: `${stats.eventBreakdown.upcoming} upcoming, ${stats.eventBreakdown.active} active`,
    },
  ];

  const venueStatusCards = [
    {
      title: "Pending Venues",
      value: stats.venueBreakdown.pending,
      icon: Clock,
      color: "bg-yellow-500",
      link: "/admin/venue-approval",
      urgent: stats.venueBreakdown.pending > 0,
    },
    {
      title: "Approved Venues",
      value: stats.venueBreakdown.approved,
      icon: CheckCircle,
      color: "bg-emerald-500",
      link: "/admin/venues?status=approved",
    },
    {
      title: "Rejected Venues",
      value: stats.venueBreakdown.rejected,
      icon: XCircle,
      color: "bg-red-500",
      link: "/admin/venues?status=rejected",
    },
  ];

  const userTypeCards = [
    {
      title: "Event Managers",
      value: stats.userBreakdown.eventManagers,
      icon: UserCheck,
      color: "bg-indigo-500",
      link: "/admin/users?type=event_manager",
    },
    {
      title: "Attendees",
      value: stats.userBreakdown.attendees,
      icon: Users,
      color: "bg-cyan-500",
      link: "/admin/users?type=attendee",
    },
    {
      title: "Administrators",
      value: stats.userBreakdown.admins,
      icon: UserX,
      color: "bg-gray-600",
      link: "/admin/users?type=admin",
    },
  ];

  const activityCards = [
    {
      title: "New Users (30 days)",
      value: stats.recentActivity.newUsers,
      icon: TrendingUp,
      color: "bg-blue-400",
      isActivity: true,
    },
    {
      title: "New Venues (30 days)",
      value: stats.recentActivity.newVenues,
      icon: Building,
      color: "bg-green-400",
      isActivity: true,
    },
    {
      title: "New Events (30 days)",
      value: stats.recentActivity.newEvents,
      icon: Calendar,
      color: "bg-purple-400",
      isActivity: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.name}. Here's what's happening with your
                platform.
              </p>
            </div>
          </div>
        </div>

        {/* Main Overview Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(card.link)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className={`${card.color} p-3 rounded-lg mr-4`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{card.title}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {card.value?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      {card.subtitle && (
                        <p className="text-xs text-gray-500 ml-16">
                          {card.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Venue Status Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Venue Management
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {venueStatusCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(card.link)}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 ${
                    card.urgent ? "ring-2 ring-yellow-400 ring-opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`${card.color} p-3 rounded-lg mr-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.value?.toLocaleString() || 0}
                      </p>
                      {card.urgent && (
                        <p className="text-xs text-yellow-600 font-medium">
                          Requires attention
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Type Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            User Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {userTypeCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  onClick={() => navigate(card.link)}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
                >
                  <div className="flex items-center">
                    <div className={`${card.color} p-3 rounded-lg mr-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {card.value?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Activity (Last 30 Days)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activityCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center">
                    <div className={`${card.color} p-3 rounded-lg mr-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        +{card.value?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Event Status
          </h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.eventBreakdown.total?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.eventBreakdown.upcoming?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.eventBreakdown.active?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Currently Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">
                  {stats.eventBreakdown.past?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/admin/venue-approval")}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <Clock className="h-4 w-4 mr-2" />
              Review Pending Venues
              {stats.venueBreakdown.pending > 0 && (
                <span className="ml-2 bg-yellow-200 text-yellow-800 text-xs rounded-full px-2 py-1">
                  {stats.venueBreakdown.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/admin/users")}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </button>
            <button
              onClick={() => navigate("/admin/venues")}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Building className="h-4 w-4 mr-2" />
              All Venues
            </button>
            <button
              onClick={() => navigate("/admin/events")}
              className="flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Manage Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
