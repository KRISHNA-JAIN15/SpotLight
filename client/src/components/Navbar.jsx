import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  LogOut,
  Bell,
  Zap,
  Home,
  Calendar,
  Heart,
  Menu,
  X,
  MapPin,
  Plus,
  Settings,
  Users,
  CheckCircle,
  Ticket,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getNavigationForUserType = (userType) => {
    const baseNavigation = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
    ];

    switch (userType) {
      case "event_manager":
        return [
          { name: "Dashboard", href: "/event-manager/dashboard", icon: Home },
          { name: "My Venues", href: "/venues/manage", icon: MapPin },
          { name: "My Events", href: "/my-events", icon: Calendar },
          { name: "Add Venue", href: "/add-venue", icon: Plus },
          { name: "Add Event", href: "/add-event", icon: Plus },
        ];
      case "admin":
        return [
          { name: "Admin Dashboard", href: "/admin", icon: Home },
          {
            name: "Venue Approval",
            href: "/admin/venue-approval",
            icon: CheckCircle,
          },
          { name: "User Management", href: "/admin/users", icon: Users },
          // { name: "Settings", href: "/admin/settings", icon: Settings },
        ];
      default: // regular user
        return [
          ...baseNavigation,
          { name: "Events", href: "/events-display", icon: Calendar },
          { name: "Liked Events", href: "/liked-events", icon: Heart },
          { name: "My Tickets", href: "/my-tickets", icon: Ticket },
        ];
    }
  };

  const navigation = isAuthenticated
    ? getNavigationForUserType(user?.type)
    : [];

  const publicNavigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "About", href: "/about", icon: Calendar },
    { name: "Contact", href: "/contact", icon: Heart },
  ];

  const isActiveRoute = (href) => location.pathname === href;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Spotlight
              </span>
            </Link>

            {/* Desktop Navigation */}
            {isAuthenticated && (
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${
                        isActiveRoute(item.href)
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Public Navigation for non-authenticated users */}
            {!isAuthenticated && (
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {publicNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${
                        isActiveRoute(item.href)
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fast Find Button - only for authenticated users */}
          {isAuthenticated && (
            <div className="hidden md:flex md:items-center md:justify-center flex-1 max-w-xs mx-8">
              <Link
                to="/fast-find"
                className="flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 space-x-2 font-medium"
              >
                <Zap className="h-4 w-4" />
                <span>Fast Find</span>
              </Link>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full">
                  <Bell className="h-5 w-5" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-gray-700 font-medium">
                      {user?.name || "User"}
                    </span>
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                        <div className="font-medium text-gray-900">
                          {user?.name}
                        </div>
                        <div className="text-xs">{user?.email}</div>
                        {user?.type && (
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                user.type === "admin"
                                  ? "bg-red-100 text-red-800"
                                  : user.type === "event_manager"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.type === "event_manager"
                                ? "Event Manager"
                                : user.type === "admin"
                                ? "Admin"
                                : "User"}
                            </span>
                          </div>
                        )}
                      </div>

                      {user?.type !== "admin" && (
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Profile
                        </Link>
                      )}

                      <div className="border-t border-gray-200"></div>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Auth buttons for non-authenticated users */
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {/* Mobile Fast Find - only for authenticated users */}
              {isAuthenticated && (
                <div className="px-3 pb-3">
                  <Link
                    to="/fast-find"
                    className="flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 space-x-2 font-medium"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Fast Find</span>
                  </Link>
                </div>
              )}

              {/* Mobile Navigation Links */}
              {(isAuthenticated ? navigation : publicNavigation).map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-base font-medium transition-colors duration-200 ${
                      isActiveRoute(item.href)
                        ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}

              {/* Mobile Auth buttons for non-authenticated users */}
              {!isAuthenticated && (
                <div className="px-3 pt-4 pb-3 border-t border-gray-200 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile menu */}
      {(isProfileMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileMenuOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;
