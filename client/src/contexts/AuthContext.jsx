import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";

// Create auth context
const AuthContext = createContext();

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Configure axios
axios.defaults.baseURL = API_BASE_URL;

// Initial state
const initialState = {
  user: null,
  pendingEmail: localStorage.getItem("pendingEmail") || null, // Store email for unverified users
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: false,
  requiresVerification: false,
  requiresProfileCompletion: false,
  error: null,
};

// Action types
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
};

// Auth reducer
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
        pendingEmail: null, // Clear pending email on successful login
      };

    case ActionTypes.LOGOUT:
      return {
        ...initialState,
        token: null,
      };

    case ActionTypes.SET_USER:
      console.log("SET_USER action - user:", action.payload);
      console.log(
        "SET_USER action - requiresProfileCompletion:",
        !action.payload.isProfileCompleted
      );
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

    default:
      return state;
  }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set axios authorization header when token changes
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
      localStorage.setItem("token", state.token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [state.token]);

  // Persist pending email to localStorage
  useEffect(() => {
    if (state.pendingEmail) {
      localStorage.setItem("pendingEmail", state.pendingEmail);
    } else {
      localStorage.removeItem("pendingEmail");
    }
  }, [state.pendingEmail]);

  // Load user on app start if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (state.token && !state.user) {
        try {
          dispatch({ type: ActionTypes.SET_LOADING, payload: true });
          const response = await axios.get("/auth/me");
          console.log("User loaded:", response.data.data.user);
          console.log(
            "Profile completed:",
            response.data.data.user.isProfileCompleted
          );
          dispatch({
            type: ActionTypes.SET_USER,
            payload: response.data.data.user,
          });
        } catch (error) {
          console.error("Failed to load user:", error);
          dispatch({ type: ActionTypes.LOGOUT });
        }
      }
    };

    loadUser();
  }, [state.token, state.user]);

  // Auth functions
  const signup = async (userData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      // Make request without Authorization header since this is a public endpoint
      const response = await axios.post("/auth/signup", userData, {
        headers: {
          Authorization: undefined,
        },
      });
      dispatch({
        type: ActionTypes.SET_PENDING_EMAIL,
        payload: userData.email,
      });
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
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      // Make request without Authorization header since this is a public endpoint
      const response = await axios.post("/auth/login", credentials, {
        headers: {
          Authorization: undefined,
        },
      });

      dispatch({
        type: ActionTypes.LOGIN_SUCCESS,
        payload: {
          user: response.data.data.user,
          token: response.data.data.token,
          requiresProfileCompletion:
            response.data.data.requiresProfileCompletion,
        },
      });

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;

      if (errorData?.requiresVerification) {
        dispatch({
          type: ActionTypes.SET_PENDING_EMAIL,
          payload: credentials.email,
        });
        dispatch({ type: ActionTypes.SET_REQUIRES_VERIFICATION });
      } else {
        const errorMessage = errorData?.message || "Login failed";
        dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      }

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const logout = () => {
    dispatch({ type: ActionTypes.LOGOUT });
  };

  const verifyEmail = async (code, emailOverride = null) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const email = emailOverride || state.pendingEmail;
      if (!email) {
        throw new Error("No email found for verification");
      }

      // Make request without Authorization header since this is a public endpoint
      const response = await axios.post(
        "/auth/verify-email",
        { code, email },
        {
          headers: {
            Authorization: undefined,
          },
        }
      );
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Email verification failed";
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  const resendVerification = async (email) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });

      // Make request without Authorization header since this is a public endpoint
      const response = await axios.post(
        "/auth/resend-verification",
        { email },
        {
          headers: {
            Authorization: undefined,
          },
        }
      );
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to resend verification email";
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      const response = await axios.put("/auth/profile", profileData);

      dispatch({
        type: ActionTypes.PROFILE_UPDATED,
        payload: {
          user: response.data.data.user,
        },
      });

      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Profile update failed";
      dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  };

  const contextValue = {
    ...state,
    signup,
    login,
    logout,
    verifyEmail,
    resendVerification,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
