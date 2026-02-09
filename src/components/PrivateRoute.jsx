import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
  try {
    const storedUser = localStorage.getItem("user");

    // If no user data, redirect to login
    if (!storedUser) return <Navigate to="/" replace />;

    let user = {};
    try {
      user = JSON.parse(storedUser);
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      localStorage.removeItem("user");
      return <Navigate to="/" replace />;
    }

    const role = user?.role?.toUpperCase();
    if (!role) {
      localStorage.removeItem("user");
      return <Navigate to="/" replace />;
    }

    // Check for role-specific token
    const tokenKey = role === "ADMIN" ? "adminToken" : role === "STAFF" ? "staffToken" : "studentToken";
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      localStorage.removeItem("user");
      return <Navigate to="/" replace />;
    }

    // If role not allowed, redirect to login
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }

    // Authorized
    return children;
  } catch (err) {
    console.error("PrivateRoute error:", err);
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }
};

export default PrivateRoute;
