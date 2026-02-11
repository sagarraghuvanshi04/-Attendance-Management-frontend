import React, { useEffect, useState } from "react";
import { 
  Armchair, CreditCard, Bell, ArrowRight, TrendingUp, Calendar, Zap, QrCode, ShieldCheck, CheckCircle, XCircle, LogOut
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loader from "../../components/Loader";

const Overview = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get("/students/dashboard");

        if (data.success) {
          const student = data.student || {};
          const stats = data.stats || {};
          const todayAtt = data.todayAttendance || {};

          setStudentData({
            name: student.name || "Student",
            studentId: student.studentId || "N/A",
            seat: student.seat || "N/A",
            totalDays: stats.totalDays || 0,
            totalPresent: stats.totalPresent || 0,
            daysLeft: student.daysLeft || 0,
            attendance: stats.attendancePercentage || 0,
            shift: student.shift || "Full Day",
            expiryDate: student.expiryDate || "N/A",
            paymentStatus: student.paymentStatus || "Paid",
            status: student.status || "Active",
            announcements: student.announcements || [],
            rules: student.rules || [],
            attendanceStatus: todayAtt.status || "Not Marked",
            entryTime: todayAtt.entryTime || null,
            exitTime: todayAtt.exitTime || null,
            workingHours: todayAtt.workingHours || 0
          });
        }
      } catch (err) {
        console.error("❌ Failed to fetch dashboard:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <Loader message="Loading Dashboard..." />;
  if (error) return <div className="flex justify-center items-center h-screen text-rose-600 font-bold">{error}</div>;
  if (!studentData) return <div className="flex justify-center items-center h-screen text-slate-400 font-bold">No data found.</div>;

  const percentage = studentData.totalDays
    ? (studentData.daysLeft / studentData.totalDays) * 100
    : 0;

  const formatTime = (time) => {
    if (!time) return "-";
    return new Date(time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

        {/* Compact Header */}
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900">
              Hi, {studentData.name.split(" ")[0]}! 👋
            </h2>
            <p className="text-sm text-slate-500 font-medium">Welcome back to your dashboard</p>
          </div>
          <Link to="/student/profile" className="flex items-center gap-2 bg-white p-2 pr-4 rounded-full shadow-lg border border-slate-100">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm">
              {studentData.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Seat</p>
              <p className="text-sm font-black text-slate-800">{studentData.seat}</p>
            </div>
          </Link>
        </header>

        {/* Today Status Badge */}
        <div className={`p-4 rounded-2xl flex items-center justify-between ${
          studentData.attendanceStatus === "Present"
            ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
            : studentData.attendanceStatus === "Absent"
            ? 'bg-gradient-to-r from-rose-500 to-red-500'
            : 'bg-gradient-to-r from-slate-400 to-slate-500'
        } shadow-lg`}>
          <div className="flex items-center gap-3 flex-1">
            {studentData.attendanceStatus === "Present" ? <CheckCircle size={24} className="text-white" /> : studentData.attendanceStatus === "Absent" ? <XCircle size={24} className="text-white" /> : <XCircle size={24} className="text-white" />}
            <div className="text-white flex-1">
              <p className="text-xs font-bold opacity-90">Today's Status</p>
              <p className="text-lg font-black">{studentData.attendanceStatus === "Present" ? "Present ✓" : studentData.attendanceStatus === "Absent" ? "Absent ✗" : "Not Marked"}</p>
              {studentData.attendanceStatus === "Present" && (
                <div className="text-xs font-medium opacity-90 mt-1 flex items-center gap-2">
                  <span>{formatTime(studentData.entryTime)}</span>
                  {studentData.exitTime && (
                    <>
                      <span>→</span>
                      <span>{formatTime(studentData.exitTime)}</span>
                      <span className="ml-1">({studentData.workingHours} hrs)</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => navigate('/student/scan-attendance')}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/30 transition-all flex-shrink-0"
          >
            <QrCode size={16} /> Scan
          </button>
        </div>

        {/* Membership Card - Mobile Optimized */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <span className="bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-400/30">
              Active Plan
            </span>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-5xl md:text-6xl font-black">{studentData.daysLeft}</p>
                <p className="text-sm text-slate-400 font-medium mt-1">Days Remaining</p>
              </div>
              <Calendar size={40} className="text-indigo-400/50" />
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
              <p className="text-xs text-slate-400">Expires: {studentData.expiryDate}</p>
              <button
                onClick={() => navigate('/student/payments')}
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-white/20 transition-all"
              >
                Renew <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats - Mobile Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            onClick={() => navigate('/student/attendance')}
            icon={<TrendingUp className="text-emerald-500" />} 
            title="Attendance" 
            value={`${studentData.attendance}%`}
            gradient="from-emerald-50 to-green-50"
          />
          <StatCard 
            onClick={() => navigate('/student/profile')}
            icon={<Armchair className="text-indigo-500" />} 
            title="Seat" 
            value={studentData.seat}
            gradient="from-indigo-50 to-purple-50"
          />
          <StatCard 
            onClick={() => navigate('/student/payments')}
            icon={<CreditCard className="text-amber-500" />} 
            title="Payment" 
            value={studentData.paymentStatus}
            gradient="from-amber-50 to-orange-50"
          />
          <StatCard 
            onClick={() => navigate('/student/notifications')}
            icon={<Bell className="text-rose-500" />} 
            title="Updates" 
            value={studentData.announcements?.length || 0}
            gradient="from-rose-50 to-pink-50"
          />
        </div>

        {/* Announcements - Compact */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-black text-slate-800 flex items-center gap-2 text-sm">
              <Bell size={16} className="text-indigo-600" /> Announcements
            </h4>
            <Link to="/student/notifications" className="text-xs font-bold text-indigo-600">View All</Link>
          </div>
          <div className="space-y-2">
            {studentData.announcements?.length ? studentData.announcements.slice(0, 3).map((notice, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${notice.type === 'alert' ? 'bg-red-500' : 'bg-indigo-500'}`} />
                  <span className="text-sm font-bold text-slate-700">{notice.title}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{notice.date}</span>
              </div>
            )) : <p className="text-sm text-slate-400 text-center py-4">No announcements</p>}
          </div>
        </div>

        {/* Rules - Compact */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100">
          <h4 className="font-black text-indigo-900 mb-3 flex items-center gap-2 text-sm">
            <ShieldCheck size={16} /> SP Digi Lab Rules
          </h4>
          <ul className="space-y-2">
            {studentData.rules?.length ? studentData.rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs font-medium text-indigo-700">
                <div className="h-1.5 w-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0" />
                <span>{rule}</span>
              </li>
            )) : (
              <li className="text-xs text-indigo-600 font-medium">No rules available</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon, title, value, onClick, gradient }) => (
  <button onClick={onClick} className={`bg-gradient-to-br ${gradient} p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all active:scale-95 text-left`}>
    <div className="mb-3">{icon}</div>
    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-900">{value}</p>
  </button>
);

export default Overview;
