import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  PieChart,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react";
import axios from "axios";

const MoneyAnalysis = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/revenue/manager-analytics", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setRevenueData(response.data.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      setError("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <DollarSign className="mx-auto h-8 w-8 mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchRevenueData}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { summary, breakdown, period } = revenueData || {};

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <DollarSign className="mx-auto h-8 w-8 mb-2" />
          <p>No revenue data available yet</p>
          <p className="text-sm">
            Start selling tickets to see your analytics!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-6 w-6 mr-2 text-green-600" />
            Revenue Analytics
          </h2>
          <div className="text-sm text-gray-500">
            {period && (
              <span>
                {new Date(period.startDate).toLocaleDateString()} -{" "}
                {new Date(period.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Monthly Revenue */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">
                  This Month (Your Share)
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(summary.managerShareMonthly)}
                </p>
                <p className="text-xs text-green-600">
                  75% of {formatCurrency(summary.monthlyRevenue)} total sales
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Total Revenue (Your Share)
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(summary.managerShareTotal)}
                </p>
                <p className="text-xs text-blue-600">
                  75% of {formatCurrency(summary.totalRevenue)} total sales
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {/* Tickets Sold */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">
                  Tickets Sold
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {summary.monthlyTicketsSold}
                </p>
                <p className="text-xs text-purple-600">
                  This month • {summary.totalTicketsSold} all time
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Revenue Split Visualization */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Revenue Split Model
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Your Share: 75%</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Platform Fee: 25%</span>
            </div>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>

        {/* Toggle Breakdown */}
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {showBreakdown ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Hide Event Breakdown
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Show Event Breakdown
            </>
          )}
        </button>
      </div>

      {/* Event Breakdown */}
      {showBreakdown && breakdown?.eventBreakdown?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Event
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Your Share (75%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platform Fee (25%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    This Month
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {breakdown.eventBreakdown.map((event) => (
                  <tr key={event.eventId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.eventTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(event.totalSales)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(event.managerShare)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatCurrency(event.adminShare)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {event.ticketsSold}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(event.monthlyRevenue)}
                      </div>
                      {event.monthlyTickets > 0 && (
                        <div className="text-xs text-gray-500">
                          {event.monthlyTickets} tickets
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {breakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              This Month Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sales:</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.thisMonth.totalSales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Share (75%):</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(breakdown.thisMonth.managerShare)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (25%):</span>
                <span className="font-semibold text-gray-500">
                  {formatCurrency(breakdown.thisMonth.adminShare)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets Sold:</span>
                <span className="font-semibold">
                  {breakdown.thisMonth.ticketsSold}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              All Time Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sales:</span>
                <span className="font-semibold">
                  {formatCurrency(breakdown.allTime.totalSales)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Share (75%):</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(breakdown.allTime.managerShare)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (25%):</span>
                <span className="font-semibold text-gray-500">
                  {formatCurrency(breakdown.allTime.adminShare)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets Sold:</span>
                <span className="font-semibold">
                  {breakdown.allTime.ticketsSold}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyAnalysis;
