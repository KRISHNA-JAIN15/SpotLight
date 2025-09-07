import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const VerifyEmailPage = () => {
  const {
    verifyEmail,
    resendVerification,
    isLoading,
    isAuthenticated,
    requiresProfileCompletion,
    pendingEmail,
  } = useAuth();
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  // Debug logging
  console.log(
    "VerifyEmailPage - isAuthenticated:",
    isAuthenticated,
    "pendingEmail:",
    pendingEmail
  );

  // If already authenticated and verified, redirect appropriately
  if (isAuthenticated && !requiresProfileCompletion) {
    console.log(
      "Redirecting to homepage - already authenticated with complete profile"
    );
    return <Navigate to="/" replace />;
  }

  // Redirect to profile completion if needed
  if (isAuthenticated && requiresProfileCompletion) {
    console.log("Redirecting to complete-profile - profile incomplete");
    return <Navigate to="/complete-profile" replace />;
  }

  // For now, let's comment out the pendingEmail redirect to debug
  // if (!pendingEmail) {
  //   console.log('Redirecting to login - no pending email');
  //   return <Navigate to="/login" replace />;
  // }

  const handleVerification = async (e) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    const emailToUse = pendingEmail || manualEmail;
    if (!emailToUse) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsVerifying(true);
      const response = await verifyEmail(verificationCode, emailToUse);

      // Get user type from response if available
      const userType = response.data?.user?.type;

      if (userType === "event_manager") {
        toast.success(
          "Email verified successfully! Welcome to Spotlight Events! Please log in to start managing venues and events."
        );
      } else {
        toast.success(
          "Email verified successfully! Please log in to access your account."
        );
      }

      // Redirect to login page after successful verification
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    const emailToUse = pendingEmail || manualEmail;

    if (!emailToUse) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      setIsResending(true);
      await resendVerification(emailToUse);
      toast.success("New verification code sent! Please check your inbox.");
      setVerificationCode(""); // Clear the input
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to resend verification code"
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6); // Only digits, max 6
    setVerificationCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verification
            </h2>

            <p className="text-gray-600 mb-6">
              We've sent a 6-digit verification code to
            </p>

            <p className="text-lg font-semibold text-blue-600 mb-6">
              {pendingEmail || "your email address"}
            </p>

            {!pendingEmail && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-sm text-red-800 mb-3">
                  <strong>No email found!</strong> Please enter your email
                  address below.
                </p>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Can't find the email?</strong> Check your spam folder or
                request a new code below.
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter 6-digit verification code
                </label>
                <input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  className="block w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-widest"
                  maxLength="6"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <LoadingSpinner size="small" text="Verifying..." />
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verify Email
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">
                Didn't receive the code?
              </p>

              <button
                onClick={handleResendCode}
                disabled={isResending}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isResending ? (
                  <LoadingSpinner size="small" text="" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Resend Code
              </button>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
