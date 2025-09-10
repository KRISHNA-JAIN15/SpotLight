import React, { useState, useEffect } from "react";
import { X, CreditCard, Shield, ArrowLeft } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const PaymentModal = ({
  event,
  tickets,
  totalAmount,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchRazorpayKey();
    }
  }, [isOpen]);

  const fetchRazorpayKey = async () => {
    try {
      const response = await axios.get("/payments/key");
      setRazorpayKey(response.data.key);
    } catch (error) {
      console.error("Error fetching Razorpay key:", error);
      toast.error("Failed to load payment configuration");
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway");
        return;
      }

      // Create payment order for the first ticket type (simplify for now)
      const primaryTicket = tickets[0];
      const token = localStorage.getItem("token");

      const orderResponse = await axios.post(
        "/payments/create-order",
        {
          eventId: event._id,
          ticketType: primaryTicket.ticketType,
          quantity: primaryTicket.quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const orderData = orderResponse.data.data;

      // Razorpay options
      const options = {
        key: razorpayKey,
        amount: orderData.amount * 100, // amount in paise
        currency: orderData.currency,
        name: "Spotlight Events",
        description: `Tickets for ${event.title}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              "/payments/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                eventId: event._id,
                ticketType: primaryTicket.ticketType,
                quantity: primaryTicket.quantity,
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (verifyResponse.data.success) {
              toast.success(
                "Payment successful! You are now registered for the event."
              );
              onPaymentSuccess(verifyResponse.data.data);
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        prefill: {
          name: localStorage.getItem("userName") || "",
          email: localStorage.getItem("userEmail") || "",
        },
        theme: {
          color: "#2563EB",
        },
        notes: {
          event_id: event._id,
          ticket_type: primaryTicket.ticketType,
          quantity: primaryTicket.quantity.toString(),
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Payment Details */}
        <div className="p-6">
          {/* Event Info */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
            <p className="text-sm text-gray-600">
              📅 {new Date(event.dateTime.startDate).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">📍 {event.venue?.name}</p>
          </div>

          {/* Ticket Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Ticket Summary</h4>
            {tickets.map((ticket, index) => (
              <div
                key={index}
                className="flex justify-between items-center mb-2"
              >
                <span className="text-sm text-gray-600 capitalize">
                  {ticket.quantity}x {ticket.ticketType}
                </span>
                <span className="text-sm font-medium">
                  ₹{ticket.price * ticket.quantity}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">
                  ₹{totalAmount}
                </span>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="flex items-center text-sm text-gray-600 mb-6">
            <Shield className="h-4 w-4 mr-2" />
            <span>Payments are secured by Razorpay</span>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading || !razorpayKey}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay ₹{totalAmount}
              </>
            )}
          </button>

          {/* Back Button */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ticket Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
