import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:5000/api",
  baseURL: "https://university-management-api.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

// Request deduplication
const pendingRequests = new Map();

const getRequestKey = (config) => {
  return `${config.method}:${config.url}`;
};

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("staffToken") ||
      localStorage.getItem("studentToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Deduplication for GET requests
    if (config.method === "get") {
      const key = getRequestKey(config);
      if (pendingRequests.has(key)) {
        return pendingRequests.get(key);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get") {
      const key = getRequestKey(response.config);
      pendingRequests.delete(key);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    if (error.config?.method === "get") {
      const key = getRequestKey(error.config);
      pendingRequests.delete(key);
    }

    if (
      status === 401 &&
      !url.includes("/login") &&
      !url.includes("/forgot-password") &&
      !url.includes("/verify-otp") &&
      !url.includes("/reset-password")
    ) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("staffToken");
      localStorage.removeItem("studentToken");
      localStorage.removeItem("user");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;
