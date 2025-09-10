import React, { useState } from "react";
import { X, Plus, Minus, Users, DollarSign } from "lucide-react";

const TicketSelectionModal = ({
  event,
  isOpen,
  onClose,
  onProceedToPayment,
}) => {
  const [selectedTickets, setSelectedTickets] = useState({});

  if (!isOpen || !event) return null;

  const handleQuantityChange = (ticketType, quantity) => {
    if (quantity < 0) return;

    const ticket = event.pricing.tickets.find((t) => t.type === ticketType);
    if (quantity > ticket.quantity.available) {
      return; // Don't allow more than available
    }

    // Check total selected tickets across all categories
    const currentTotal = getTotalQuantity();
    const currentTicketQty = selectedTickets[ticketType] || 0;
    const newTotal = currentTotal - currentTicketQty + quantity;

    // Only allow a total of 1 ticket across all categories
    if (newTotal > 1) {
      return;
    }

    setSelectedTickets((prev) => ({
      ...prev,
      [ticketType]: quantity,
    }));
  };

  const getTotalQuantity = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce(
      (total, [ticketType, quantity]) => {
        const ticket = event.pricing.tickets.find((t) => t.type === ticketType);
        return total + ticket.price * quantity;
      },
      0
    );
  };

  const handleProceedToPayment = () => {
    const tickets = Object.entries(selectedTickets)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketType, quantity]) => ({
        ticketType,
        quantity,
        price: event.pricing.tickets.find((t) => t.type === ticketType).price,
      }));

    if (tickets.length === 0) {
      return;
    }

    onProceedToPayment(tickets, getTotalAmount());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Select Tickets
              </h2>
              <p className="text-gray-600 mt-1">{event.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center text-sm text-gray-600 space-x-4">
            <span>
              📅 {new Date(event.dateTime.startDate).toLocaleDateString()}
            </span>
            <span>📍 {event.venue?.name}</span>
            <span className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {event.attendees?.length || 0}/{event.pricing?.totalCapacity}
            </span>
          </div>
        </div>

        {/* Ticket Selection */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Available Tickets</h3>
          <p className="text-sm text-gray-600 mb-4">
            Select one ticket (maximum 1 ticket per person across all
            categories)
          </p>
          <div className="space-y-4">
            {event.pricing.tickets.map((ticket) => (
              <div
                key={ticket.type}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {ticket.type}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {ticket.quantity.available} available of{" "}
                      {ticket.quantity.total} (Only 1 ticket allowed per person)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />₹{ticket.price}
                    </p>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quantity</span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          ticket.type,
                          (selectedTickets[ticket.type] || 0) - 1
                        )
                      }
                      disabled={
                        !selectedTickets[ticket.type] ||
                        selectedTickets[ticket.type] <= 0
                      }
                      className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {selectedTickets[ticket.type] || 0}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          ticket.type,
                          (selectedTickets[ticket.type] || 0) + 1
                        )
                      }
                      disabled={
                        getTotalQuantity() >= 1 || // Disable when total tickets is 1
                        (selectedTickets[ticket.type] || 0) >=
                          ticket.quantity.available
                      }
                      className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal for this ticket type */}
                {selectedTickets[ticket.type] > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {selectedTickets[ticket.type]} × ₹{ticket.price}
                      </span>
                      <span className="font-medium">
                        ₹{selectedTickets[ticket.type] * ticket.price}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary and Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-600">
                Total Tickets: {getTotalQuantity()}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Total: ₹{getTotalAmount()}
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceedToPayment}
              disabled={getTotalQuantity() === 0}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Proceed to Payment (₹{getTotalAmount()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketSelectionModal;
