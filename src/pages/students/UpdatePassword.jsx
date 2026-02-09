import { useState } from "react";
import { ShieldCheck, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api"; 
import { toast, Toaster } from "react-hot-toast";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States for passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await api.put("/students/change-password", {
        oldPassword: currentPassword,
        newPassword: newPassword,
      });

      if (response.data.success) {
        toast.success("Password updated successfully! 🎉");
        
        setTimeout(() => {
          navigate("/student/security"); 
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f6ff] to-[#efe9ff] px-4">
      {/* Toast Container for notifications */}
      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 animate-in fade-in zoom-in duration-300">
        
        {/* Icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <ShieldCheck className="text-white" size={32} />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-black text-center text-slate-800">Security Update</h2>
        <p className="text-center text-slate-500 mt-2 font-medium">
          Update your password to keep your account safe.
        </p>

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Current / Temporary Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border-slate-100 px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold"
              required
            />
          </div>

          {/* New Password */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-2xl border-slate-100 px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-9 text-slate-400 hover:text-purple-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new password"
              className="w-full rounded-2xl border-slate-100 px-4 py-3 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all font-bold"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 rounded-2xl py-4 text-white font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl hover:shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>

          <Link
            to="/dashboard/security"
            className="flex items-center justify-center gap-2 mt-4 text-slate-400 hover:text-purple-600 font-bold transition-colors"
          >
            <ArrowLeft size={16} /> Back to Security
          </Link>
        </form>
      </div>
    </div>
  );
}