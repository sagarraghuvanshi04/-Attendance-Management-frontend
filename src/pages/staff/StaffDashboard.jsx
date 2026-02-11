import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api"; 
import { getCachedData, setCachedData } from "../../services/cache";
import { 
  Users, QrCode, LogIn, LogOut, 
  Clock, ArrowRight, MapPin, Inbox, Search, ChevronRight, Zap, Bell
} from "lucide-react";
import Loader from "../../components/Loader";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // --- Backend State ---
  const [staffInfo, setStaffInfo] = useState(null);
  const [activityData, setActivityData] = useState({
    stats: { active: 0, arrivals: 0, departures: 0, totalStudents: 0 },
    scans: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 1. Digital Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch Data from Backend with Caching
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Try to use cached data first
        const cachedProfile = getCachedData("staffProfile");
        const cachedActivity = getCachedData("dashboardActivity");

        if (cachedProfile) setStaffInfo(cachedProfile);
        if (cachedActivity) {
          setActivityData({
            stats: cachedActivity.stats || { active: 0, arrivals: 0, departures: 0, totalStudents: 0 },
            scans: cachedActivity.scans || []
          });
        }

        setLoading(false);

        // Fetch fresh data in background
        try {
          const [profileRes, activityRes] = await Promise.all([
            api.get("/staff/profile"),
            api.get("/staff/activity")
          ]);

          if (profileRes.data?.success) {
            setStaffInfo(profileRes.data.staff);
            setCachedData("staffProfile", profileRes.data.staff);
          }
          if (activityRes.data?.success) {
            const newActivityData = {
              stats: activityRes.data.stats || { active: 0, arrivals: 0, departures: 0, totalStudents: 0 },
              scans: activityRes.data.scans || []
            };
            setActivityData(newActivityData);
            setCachedData("dashboardActivity", newActivityData);
          }
        } catch (error) {
          console.error("Background sync error:", error.message);
        }
      } catch (error) {
        console.error("Dashboard Sync Failed:", error.message);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    const searchStudents = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        const res = await api.get(`/staff/students?search=${searchQuery}`);
        if (res.data.success) {
          setSearchResults(res.data.students.slice(0, 5));
          setShowSearchResults(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    const debounce = setTimeout(searchStudents, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // 3. Logout Function
  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("user");
    localStorage.removeItem("HTML5_QRCODE_DATA");
    localStorage.removeItem("lastSeenNotification");
    localStorage.removeItem("readNotifications");
    navigate("/");
  };

  // UI rendering logic for Stats
  const stats = [
    { label: "Total Students", value: activityData.stats.totalStudents.toString(), color: "text-blue-600", bg: "bg-blue-50", icon: <Users /> },
    { label: "Arrivals Today", value: activityData.stats.arrivals.toString(), color: "text-emerald-600", bg: "bg-emerald-50", icon: <LogIn /> },
    { label: "Departures Today", value: activityData.stats.departures.toString(), color: "text-amber-600", bg: "bg-amber-50", icon: <LogOut /> },
  ];

  if (loading) {
    return <Loader message="Live Syncing..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* --- Header --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Live Terminal</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Staff Overview</h2>
          <p className="text-sm md:text-base text-slate-500 font-medium italic">
            Welcome back, <span className="text-indigo-600 font-bold">{staffInfo?.name || "Staff"}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-wrap w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <div className="flex items-center gap-2 md:gap-3 bg-white p-2 rounded-xl md:rounded-[1.5rem] shadow-sm border border-slate-100">
              <div className="bg-slate-50 p-2 rounded-lg md:rounded-xl text-slate-400">
                <Search size={18} className="md:w-5 md:h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Quick search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="bg-transparent outline-none text-sm font-medium w-full md:w-48"
              />
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-xl md:rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                {searchResults.map((student) => (
                  <button
                    key={student._id}
                    onClick={() => {
                      navigate(`/staff/student/${student._id}`);
                      setShowSearchResults(false);
                      setSearchQuery("");
                    }}
                    className="w-full p-3 md:p-4 hover:bg-slate-50 transition-colors text-left flex items-center justify-between border-b border-slate-50 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-sm md:text-base text-slate-800">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.studentId} • {student.email}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 bg-white text-red-500 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold border border-red-50 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 text-sm"
          >
            <LogOut size={18} /> Logout
          </button>

          <div className="flex items-center gap-3 md:gap-4 bg-white p-2.5 md:p-3 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-lg md:shadow-xl shadow-slate-200/50">
            <div className="bg-slate-900 text-white p-2 md:p-3 rounded-xl md:rounded-2xl"><Clock size={20} className="md:w-6 md:h-6 animate-pulse" /></div>
            <div className="pr-2 md:pr-4">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Time</p>
              <p className="text-base md:text-xl font-black text-slate-800 tabular-nums">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, idx) => {
          const getNavigationPath = (label) => {
            switch(label) {
              case "Total Students": return "/staff/students";
              case "Arrivals Today": return "/staff/attendance?filter=arrivals";
              case "Departures Today": return "/staff/attendance?filter=departures";
              default: return "/staff/dashboard";
            }
          };
          
          return (
            <button 
              key={idx} 
              onClick={() => navigate(getNavigationPath(stat.label))}
              className="group bg-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:scale-105 cursor-pointer text-left w-full"
            >
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <div className={`h-12 w-12 md:h-14 md:w-14 ${stat.bg} ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(stat.icon, { size: 24, className: "md:w-7 md:h-7" })}
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter group-hover:text-indigo-600 transition-colors">{stat.value}</h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* --- Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-5 bg-white p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <h3 className="font-black text-slate-800 text-lg md:text-xl mb-6 md:mb-8 flex items-center gap-2"><Zap size={18} className="md:w-5 md:h-5" /> Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <button 
              onClick={() => navigate('/staff/scanner')}
              className="group p-4 md:p-6 bg-indigo-50 hover:bg-indigo-100 rounded-2xl md:rounded-3xl border border-indigo-100 transition-all hover:scale-105"
            >
              <div className="h-12 w-12 md:h-14 md:w-14 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <QrCode size={20} className="md:w-6 md:h-6 text-white" />
              </div>
              <p className="font-black text-indigo-900 text-sm md:text-base">QR Scanner</p>
              <p className="text-xs text-indigo-600 font-medium">Scan student entry/exit</p>
            </button>
            
            <button 
              onClick={() => navigate('/staff/students')}
              className="group p-4 md:p-6 bg-emerald-50 hover:bg-emerald-100 rounded-2xl md:rounded-3xl border border-emerald-100 transition-all hover:scale-105"
            >
              <div className="h-12 w-12 md:h-14 md:w-14 bg-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users size={20} className="md:w-6 md:h-6 text-white" />
              </div>
              <p className="font-black text-emerald-900 text-sm md:text-base">Students</p>
              <p className="text-xs text-emerald-600 font-medium">Manage student data</p>
            </button>
            
            <button 
              onClick={() => navigate('/staff/attendance')}
              className="group p-4 md:p-6 bg-amber-50 hover:bg-amber-100 rounded-2xl md:rounded-3xl border border-amber-100 transition-all hover:scale-105"
            >
              <div className="h-12 w-12 md:h-14 md:w-14 bg-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Clock size={20} className="md:w-6 md:h-6 text-white" />
              </div>
              <p className="font-black text-amber-900 text-sm md:text-base">Attendance</p>
              <p className="text-xs text-amber-600 font-medium">View daily records</p>
            </button>
            
            <button 
              onClick={() => navigate('/staff/notifications')}
              className="group p-4 md:p-6 bg-purple-50 hover:bg-purple-100 rounded-2xl md:rounded-3xl border border-purple-100 transition-all hover:scale-105"
            >
              <div className="h-12 w-12 md:h-14 md:w-14 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Bell size={20} className="md:w-6 md:h-6 text-white" />
              </div>
              <p className="font-black text-purple-900 text-sm md:text-base">Notifications</p>
              <p className="text-xs text-purple-600 font-medium">Send announcements</p>
            </button>
          </div>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-7 bg-white p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="font-black text-slate-800 text-lg md:text-xl">Live Scan Feed</h3>
            <button 
              onClick={() => navigate('/staff/attendance')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:gap-2 transition-all"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {activityData.scans.length > 0 ? (
              activityData.scans.map((scan) => (
                <div key={scan._id} className="flex items-center justify-between p-4 md:p-5 bg-slate-50 rounded-xl md:rounded-[2rem] border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-3 md:gap-5">
                    <div className={`h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl flex items-center justify-center ${scan.type === 'Entry' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {scan.type === 'Entry' ? <LogIn size={20} className="md:w-6 md:h-6" /> : <LogOut size={20} className="md:w-6 md:h-6" />}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-base md:text-lg">{scan.studentId?.name || "Guest"}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase">Seat {scan.studentId?.seat || "N/A"} • {new Date(scan.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                  <div className="h-8 w-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300"><ArrowRight size={16} /></div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <Inbox size={48} strokeWidth={1} className="md:w-16 md:h-16 opacity-20 mb-4" />
                <p className="text-lg md:text-xl font-black uppercase opacity-40">No Students Yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Action Banner --- */}
      <div className="bg-slate-900 p-6 md:p-12 rounded-2xl md:rounded-[4rem] text-white flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="max-w-md text-center lg:text-left">
          <h3 className="text-2xl md:text-4xl font-black mb-3 md:mb-4">Start Scanning</h3>
          <p className="text-sm md:text-base text-slate-400 font-medium">Click the button to launch the QR scanner terminal.</p>
        </div>
        <button 
          onClick={() => navigate('/staff/scanner')}
          className="bg-white text-slate-900 px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:bg-indigo-600 hover:text-white transition-all shadow-2xl flex items-center gap-3 md:gap-4 w-full lg:w-auto justify-center"
        >
          <QrCode size={24} className="md:w-7 md:h-7" /> Start Scanning <ArrowRight size={20} className="md:w-6 md:h-6" />
        </button>
      </div>

    </div>
  );
};

export default StaffDashboard;
