import { LogIn, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Auth() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Detect API route from ID
  const detectLoginRoute = (id) => {
  const cleanId = id.trim().toUpperCase();

  if (cleanId === "ADMIN" || cleanId === "ADMIN01") return "/admin/login";
  if (cleanId.includes("ST")) return "/students/login";
  if (cleanId.includes("SF")) return "/staff/login";

  return null;
};


  const handleLogin = async (e) => {
    e.preventDefault();

    if (!userId || !password) {
      toast.error("User ID and password are required");
      return;
    }

    const normalizedId = userId.trim().toUpperCase();
    const route = detectLoginRoute(normalizedId);

    console.log("Input ID:", userId);
    console.log("Normalized ID:", normalizedId);
    console.log("Detected Route:", route);

    if (!route) {
      toast.error("Invalid User ID format. Use: ADMIN, 2026ST01, or 2026SF01");
      return;
    }

    try {
      setLoading(true);

      // Prepare payload
      const payload =
        route === "/students/login"
          ? { studentId: normalizedId, password }
          : route === "/staff/login"
          ? { staffId: normalizedId, password }
          : { adminId: normalizedId, password };

      const res = await api.post(route, payload);

      if (!res.data.token) throw new Error("No token returned from server");

      // Determine role and normalize user data
      let role = "";
      let userData = {};
      if (res.data.student) {
        role = "STUDENT";
        userData = { ...res.data.student, role };
      } else if (res.data.staff) {
        role = "STAFF";
        userData = { ...res.data.staff, role };
      } else if (res.data.admin) {
        role = "ADMIN";
        userData = { ...res.data.admin, role };
      } else {
        throw new Error("Invalid user data received");
      }

      // Save token and user info in localStorage
      const tokenKey = role === "ADMIN" ? "adminToken" : role === "STAFF" ? "staffToken" : "studentToken";
      localStorage.setItem(tokenKey, res.data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      toast.success("Login successful");

      // Redirect based on role
      if (role === "STUDENT") navigate("/student/overview");
      else if (role === "STAFF") navigate("/staff/dashboard");
      else navigate("/admin/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f6ff] to-[#efe9ff] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">SPL</span>
        </div>

        <h2 className="text-2xl font-bold text-center">Library Member Login</h2>
        <p className="text-center text-gray-500 mt-2">Student / Staff / Admin Login</p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              placeholder="2026ST01 / 2026SF01 / ADMIN"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg py-3 text-white font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 transition disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          First time login or forgot password?
          <Link
            to="/forgot-password"
            className="text-purple-600 font-medium hover:underline flex items-center justify-center gap-1 mx-auto mt-1"
          >
            <KeyRound size={14} />
            Forgot Password
          </Link>
        </p>
      </div>
    </div>
  );
}
