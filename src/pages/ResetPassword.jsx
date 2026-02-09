import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LockKeyhole, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp, role } = location.state || {}; // include role

  useEffect(() => {
    if (!email || !role) {
      toast.error("Invalid session. Please start over.");
      navigate("/forgot-password");
    }
  }, [email, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return toast.error("All fields required");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    try {
      setLoading(true);

      // Choose API route based on role
      const url = role === "STUDENT" 
        ? "/students/reset-password" 
        : "/staff/reset-password";

      const res = await api.post(url, { email, otp, newPassword });

      toast.success(res.data.message || "Password updated successfully!");
      navigate("/"); // Redirect to login
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f6ff] to-[#efe9ff] p-4">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full mb-4">
            <LockKeyhole size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Set New Password</h2>
          <p className="text-gray-500 mt-2">
            Almost there! Create a strong password to secure your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Password Requirements Hint */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <CheckCircle2 size={16} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Ensure your password is at least 6 characters long and includes a mix of letters and numbers.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transform transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-indigo-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating Password...
              </>
            ) : (
              "Save & Continue"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
