import axios from "axios";

const api = axios.create({
  // baseURL: "http://localhost:5000/api",
  baseURL: "https://librarymanagementbackend-ztsr.onrender.com/api",

  headers: {
    "Content-Type": "application/json",
  },
});

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

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

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
