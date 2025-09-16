import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
axios.defaults.baseURL = API_BASE_URL;

const initialState = {
  user: null,
  pendingEmail: localStorage.getItem("pendingEmail") || null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: false,
  requiresVerification: false,
  requiresProfileCompletion: false,
  error: null,
};

const ActionTypes = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT: "LOGOUT",
  SET_USER: "SET_USER",
  SET_REQUIRES_VERIFICATION: "SET_REQUIRES_VERIFICATION",
  SET_REQUIRES_PROFILE_COMPLETION: "SET_REQUIRES_PROFILE_COMPLETION",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  SET_PENDING_EMAIL: "SET_PENDING_EMAIL",
  SET_BACKEND_STATUS: "SET_BACKEND_STATUS",
};

const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload, error: null };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    case ActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        requiresProfileCompletion:
          action.payload.requiresProfileCompletion || false,
        isLoading: false,
        error: null,
        requiresVerification: false,
        pendingEmail: null,
      };

    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        token: null,
      };

    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        requiresProfileCompletion: !action.payload.isProfileCompleted,
        isLoading: false,
      };

    case ActionTypes.SET_REQUIRES_VERIFICATION:
      return {
        ...state,
        requiresVerification: true,
        isLoading: false,
      };

    case ActionTypes.SET_REQUIRES_PROFILE_COMPLETION:
      return {
        ...state,
        requiresProfileCompletion: action.payload,
        isLoading: false,
      };

    case ActionTypes.PROFILE_UPDATED:
      return {
        ...state,
        user: action.payload.user,
        requiresProfileCompletion: !action.payload.user.isProfileCompleted,
        isLoading: false,
      };

    case ActionTypes.SET_PENDING_EMAIL:
      return {
        ...state,
        pendingEmail: action.payload,
        isLoading: false,
      };

    case ActionTypes.SET_BACKEND_STATUS:
      return {
        ...state,
        backendConnected: action.payload,
      };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [backendError, setBackendError] = useState(null);

  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
      localStorage.setItem("token", state.token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [state.token]);

  useEffect(() => {
    if (state.pendingEmail) {
      localStorage.setItem("pendingEmail", state.pendingEmail);
    } else {
      localStorage.removeItem("pendingEmail");
    }
  }, [state.pendingEmail]);

  // Health check backend first, then load user
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First, ping the backend root route
        console.log('Checking backend health...');
        await axios.get("/", {
          timeout: 10000, // 10 second timeout
        });
        
        console.log('Backend is healthy, proceeding with auth check...');
        setBackendHealthy(true);
        setBackendError(null);

        // If backend is healthy and we have a token, try to load user
        if (state.token && !state.user) {
          try {
            const response = await axios.get("/auth/me");
            dispatch({ type: ActionTypes.SET_USER, payload: response.data.data.user });
          } catch (error) {
            console.error("Failed to load user:", error);
            // If token is invalid, clear it
            if (error.response?.status === 401) {
              dispatch({ type: ActionTypes.LOGOUT });
            }
          }
        }
      } catch (error) {
        console.error("Backend health check failed:", error);
        setBackendHealthy(false);
        setBackendError(error.message || "Backend connection failed");
        
        // You might want to show an error state or retry mechanism
        // For now, we'll just log the error and not load the user
      } finally {
        setLoadingAuth(false);
      }
    };

    initializeApp();
  }, [state.token, state.user]);

  const signup = async (userData) => {
    if (!backendHealthy) {
      throw new Error("Backend is not available. Please try again later.");
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await axios.post("/auth/signup", userData, {
        headers: { Authorization: undefined },
      });
      dispatch({ type: ActionTypes.SET_PENDING_EMAIL, payload: userData.email });
      dispatch({ type: ActionTypes.SET_REQUIRES_VERIFICATION });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Signup failed";
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const login = async (credentials) => {
    if (!backendHealthy) {
      throw new Error("Backend is not available. Please try again later.");
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await axios.post("/auth/login", credentials, {
        headers: { Authorization: undefined },
      });

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.data.data.user,
          token: response.data.data.token,
          requiresProfileCompletion: response.data.data.requiresProfileCompletion,
        },
      });

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.requiresVerification) {
        dispatch({ type: ActionTypes.SET_PENDING_EMAIL, payload: credentials.email });
        dispatch({ type: ActionTypes.SET_REQUIRES_VERIFICATION });
      } else {
        const errorMessage = errorData?.message || "Login failed";
        dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      }
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const logout = () => dispatch({ type: ActionTypes.LOGOUT });

  const verifyEmail = async (code, emailOverride = null) => {
    if (!backendHealthy) {
      throw new Error("Backend is not available. Please try again later.");
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const email = emailOverride || state.pendingEmail;
      if (!email) throw new Error("No email found for verification");
      const response = await axios.post("/auth/verify-email", { code, email }, {
        headers: { Authorization: undefined },
      });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Email verification failed";
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  const resendVerification = async (email) => {
    if (!backendHealthy) {
      throw new Error("Backend is not available. Please try again later.");
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await axios.post("/auth/resend-verification", { email }, {
        headers: { Authorization: undefined },
      });
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to resend verification email";
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    if (!backendHealthy) {
      throw new Error("Backend is not available. Please try again later.");
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await axios.put("/auth/profile", profileData);
      dispatch({ type: ActionTypes.PROFILE_UPDATED, payload: { user: response.data.data.user } });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Profile update failed";
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const retryConnection = async () => {
    setLoadingAuth(true);
    setBackendError(null);
    
    try {
      await axios.get("/", { timeout: 10000 });
      setBackendHealthy(true);
      setBackendError(null);
      
      // Try to load user if token exists
      if (state.token && !state.user) {
        try {
          const response = await axios.get("/auth/me");
          dispatch({ type: ActionTypes.SET_USER, payload: response.data.data.user });
        } catch (error) {
          console.error("Failed to load user:", error);
          if (error.response?.status === 401) {
            dispatch({ type: ActionTypes.LOGOUT });
          }
        }
      }
    } catch (error) {
      setBackendHealthy(false);
      setBackendError(error.message || "Backend connection failed");
    } finally {
      setLoadingAuth(false);
    }
  };

  const clearError = () => dispatch({ type: ActionTypes.CLEAR_ERROR });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loadingAuth,
        backendHealthy,
        backendError,
        signup,
        login,
        logout,
        verifyEmail,
        resendVerification,
        updateProfile,
        retryConnection,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export default AuthContext;
