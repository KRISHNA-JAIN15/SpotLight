const mongoose = require("mongoose");
const Event = require("../models/Event");

// @desc    Get manager revenue analytics
// @route   GET /api/revenue/manager-analytics
// @access  Private (Event Manager)
const getManagerRevenue = async (req, res) => {
  try {
    if (req.user.type !== "event_manager") {
      return res.status(403).json({
        success: false,
        message: "Only event managers can access this resource",
      });
    }

    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    // Get all events by this manager with completed payments
    const events = await Event.find({
      organizer: req.user._id,
      "attendees.paymentStatus": "completed",
    });

    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let totalTicketsSold = 0;
    let monthlyTicketsSold = 0;

    const revenueBreakdown = {
      thisMonth: {
        totalSales: 0,
        managerShare: 0, // 75%
        adminShare: 0, // 25%
        ticketsSold: 0,
      },
      allTime: {
        totalSales: 0,
        managerShare: 0,
        adminShare: 0,
        ticketsSold: 0,
      },
      eventBreakdown: [],
    };

    events.forEach((event) => {
      const completedAttendees = event.attendees.filter(
        (attendee) => attendee.paymentStatus === "completed"
      );

      let eventRevenue = 0;
      let eventMonthlyRevenue = 0;
      let eventTicketsSold = 0;
      let eventMonthlyTickets = 0;

      completedAttendees.forEach((attendee) => {
        const amount = attendee.totalAmount || 0;
        eventRevenue += amount;
        eventTicketsSold += attendee.quantity || 1;

        // Check if payment was made this month
        const paymentDate = attendee.bookingDate || new Date();
        if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
          eventMonthlyRevenue += amount;
          eventMonthlyTickets += attendee.quantity || 1;
        }
      });

      totalRevenue += eventRevenue;
      monthlyRevenue += eventMonthlyRevenue;
      totalTicketsSold += eventTicketsSold;
      monthlyTicketsSold += eventMonthlyTickets;

      if (eventRevenue > 0) {
        revenueBreakdown.eventBreakdown.push({
          eventId: event._id,
          eventTitle: event.title,
          totalSales: eventRevenue,
          managerShare: eventRevenue * 0.75,
          adminShare: eventRevenue * 0.25,
          ticketsSold: eventTicketsSold,
          monthlyRevenue: eventMonthlyRevenue,
          monthlyTickets: eventMonthlyTickets,
        });
      }
    });

    // Calculate splits
    revenueBreakdown.thisMonth = {
      totalSales: monthlyRevenue,
      managerShare: monthlyRevenue * 0.75,
      adminShare: monthlyRevenue * 0.25,
      ticketsSold: monthlyTicketsSold,
    };

    revenueBreakdown.allTime = {
      totalSales: totalRevenue,
      managerShare: totalRevenue * 0.75,
      adminShare: totalRevenue * 0.25,
      ticketsSold: totalTicketsSold,
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          monthlyRevenue,
          totalTicketsSold,
          monthlyTicketsSold,
          managerShareTotal: totalRevenue * 0.75,
          managerShareMonthly: monthlyRevenue * 0.75,
        },
        breakdown: revenueBreakdown,
        period: {
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear(),
          startDate: startOfMonth,
          endDate: endOfMonth,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching manager revenue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error: error.message,
    });
  }
};

// @desc    Get admin revenue analytics (all managers)
// @route   GET /api/revenue/admin-analytics
// @access  Private (Admin)
const getAdminRevenue = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can access this resource",
      });
    }

    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    // Get all events with completed payments
    const events = await Event.find({
      "attendees.paymentStatus": "completed",
    }).populate("organizer", "name email");

    let totalPlatformRevenue = 0;
    let monthlyPlatformRevenue = 0;
    const managerBreakdown = {};

    events.forEach((event) => {
      const completedAttendees = event.attendees.filter(
        (attendee) => attendee.paymentStatus === "completed"
      );

      let eventRevenue = 0;
      let eventMonthlyRevenue = 0;

      completedAttendees.forEach((attendee) => {
        const amount = attendee.totalAmount || 0;
        eventRevenue += amount;

        // Check if payment was made this month
        const paymentDate = attendee.bookingDate || new Date();
        if (paymentDate >= startOfMonth && paymentDate <= endOfMonth) {
          eventMonthlyRevenue += amount;
        }
      });

      if (eventRevenue > 0) {
        const managerId = event.organizer._id.toString();
        if (!managerBreakdown[managerId]) {
          managerBreakdown[managerId] = {
            manager: event.organizer,
            totalSales: 0,
            monthlyRevenue: 0,
            adminShare: 0,
            monthlyAdminShare: 0,
            events: [],
          };
        }

        managerBreakdown[managerId].totalSales += eventRevenue;
        managerBreakdown[managerId].monthlyRevenue += eventMonthlyRevenue;
        managerBreakdown[managerId].adminShare += eventRevenue * 0.25;
        managerBreakdown[managerId].monthlyAdminShare +=
          eventMonthlyRevenue * 0.25;

        managerBreakdown[managerId].events.push({
          eventId: event._id,
          eventTitle: event.title,
          revenue: eventRevenue,
          monthlyRevenue: eventMonthlyRevenue,
          adminShare: eventRevenue * 0.25,
        });
      }

      totalPlatformRevenue += eventRevenue;
      monthlyPlatformRevenue += eventMonthlyRevenue;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPlatformRevenue,
          monthlyPlatformRevenue,
          adminShareTotal: totalPlatformRevenue * 0.25,
          adminShareMonthly: monthlyPlatformRevenue * 0.25,
          managerShareTotal: totalPlatformRevenue * 0.75,
          managerShareMonthly: monthlyPlatformRevenue * 0.75,
        },
        managerBreakdown: Object.values(managerBreakdown),
        period: {
          month: currentMonth.getMonth() + 1,
          year: currentMonth.getFullYear(),
          startDate: startOfMonth,
          endDate: endOfMonth,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin revenue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin revenue analytics",
      error: error.message,
    });
  }
};

module.exports = {
  getManagerRevenue,
  getAdminRevenue,
};
