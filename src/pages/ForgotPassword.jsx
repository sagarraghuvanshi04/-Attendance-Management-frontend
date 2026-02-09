import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");

    try {
      setLoading(true);

      // Hit the correct route based on role
      let url = "";
      if (role === "STUDENT") url = "/students/forgot-password";
      else if (role === "STAFF") url = "/staff/forgot-password";

      const res = await api.post(url, { email });

      toast.success(res.data.message || "OTP sent successfully!");
      // Navigate to OTP verification page with email & role
      navigate("/verify-otp", { state: { email, role } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f6ff] to-[#efe9ff] p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl relative">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
          Forgot Password
        </h2>

        {/* Role Selection */}
        <div className="flex justify-center mb-4 space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="role"
              value="STUDENT"
              checked={role === "STUDENT"}
              onChange={() => setRole("STUDENT")}
              className="accent-purple-600"
            />
            <span>Student</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="role"
              value="STAFF"
              checked={role === "STAFF"}
              onChange={() => setRole("STAFF")}
              className="accent-purple-600"
            />
            <span>Staff</span>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transform transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-indigo-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
