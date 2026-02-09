import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Loader2, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const role = location.state?.role || "STUDENT"; // Default to STUDENT

  // Security check
  useEffect(() => {
    if (!email || !role) {
      toast.error("Session expired. Please try again.");
      navigate("/forgot-password");
    }
  }, [email, role, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the 6-digit code");

    try {
      setLoading(true);

      // Choose route based on role
      const url = role === "STUDENT" 
        ? "/students/verify-otp" 
        : "/staff/verify-otp";

      const res = await api.post(url, { email, otp });

      toast.success(res.data.message);
      // Navigate to Reset Password page, passing email, role, and otp
      navigate("/reset-password", { state: { email, role, otp } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      setResending(true);

      // Dynamic resend route
      const url = role === "STUDENT" 
        ? "/students/forgot-password" 
        : "/staff/forgot-password";

      await api.post(url, { email });
      toast.success("New OTP sent to your email");
      setCountdown(120);
      setCanResend(false);
    } catch (err) {
      toast.error("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f5f6ff] to-[#efe9ff] p-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Verify OTP</h2>
          <p className="text-gray-500 mt-2">
            We've sent a code to <br />
            <span className="font-semibold text-gray-700">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Enter Verification Code
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="0 0 0 0 0 0"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-bold border border-gray-300 rounded-xl outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transform transition-active:scale-95 disabled:opacity-70 shadow-lg shadow-purple-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center space-y-4">
          {!canResend ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Resend OTP in</p>
              <p className="text-2xl font-bold text-purple-600">{formatTime(countdown)}</p>
            </div>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              <RefreshCcw size={14} className={`mr-2 ${resending ? 'animate-spin' : ''}`} />
              Resend Code
            </button>
          )}
          
          <Link
            to="/forgot-password"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2" />
            Use a different email
          </Link>
        </div>
      </div>
    </div>
  );
}
