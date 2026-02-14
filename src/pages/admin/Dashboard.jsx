// src/pages/admin/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, IndianRupee, MapPin, Zap, 
  ArrowUpRight, Activity, ChevronRight, Search 
} from "lucide-react";
import api from "../../services/api"; // your axios instance
import toast from "react-hot-toast";
import Loader from "../../components/Loader";

const Dashboard = () => {
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalStaff: 0,
    revenue: 0,
    availableSeats: 0,
    totalSeats: 60,
    occupiedSeats: [],
  });

  const [liveStudents, setLiveStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchLiveStudents = async () => {
    try {
      const attendanceRes = await api.get("/attendance/live-students");
      if (attendanceRes.data.success) {
        setLiveStudents(attendanceRes.data.liveStudents || []);
      }
    } catch (err) {
      console.error("Error fetching live students:", err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      console.log("Dashboard API Response:", res.data);
      console.log("Occupied Seats:", res.data.stats?.occupiedSeats);
      console.log("Available Seats:", res.data.stats?.availableSeats);
      if (res.data.success) {
        setDashboardStats(res.data.stats);
      } else {
        toast.error("Failed to load dashboard stats");
      }

      // Fetch live students (currently in library)
      const liveStudentsRes = await api.get("/attendance/live-students");
      if (liveStudentsRes.data.success) {
        setLiveStudents(liveStudentsRes.data.liveStudents || []);
      }

      // Fetch admin profile
      const profileRes = await api.get("/admin/profile");
      if (profileRes.data.success) {
        setAdminProfile(profileRes.data.admin);
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      toast.error(err.response?.data?.message || "Error fetching stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh live students every 30 seconds
    const interval = setInterval(() => {
      fetchLiveStudents();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const searchStudents = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      try {
        const res = await api.get(`/admin/students?search=${searchQuery}`);
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

  const stats = [
    { label: "Total Students", value: dashboardStats.totalStudents, icon: <Users />, color: "text-blue-600", bg: "bg-blue-50", path: "/admin/students" },
    { label: "Monthly Revenue", value: `₹${dashboardStats.revenue || 0}`, icon: <IndianRupee />, color: "text-green-600", bg: "bg-green-50", path: "/admin/payments" },
    { label: "Arrivals Today", value: dashboardStats.arrivals || 0, icon: <Activity />, color: "text-emerald-600", bg: "bg-emerald-50", path: "/admin/attendance?filter=arrivals" },
    { label: "Departures Today", value: dashboardStats.departures || 0, icon: <MapPin />, color: "text-purple-600", bg: "bg-purple-50", path: "/admin/attendance?filter=departures" },
  ];

  if (loading) {
    return <Loader message="Loading Dashboard..." />;
  }

  return (
    <div className="p-2 md:p-6 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            Library <span className="text-indigo-600">Command</span>
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1 text-sm md:text-base">
            <Activity size={14} className="text-emerald-500 md:w-4 md:h-4" /> 
            Everything is running smoothly today
          </p>
        </div>
        
        <div className="relative w-full md:w-auto">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3 bg-white p-2 rounded-xl md:rounded-[1.5rem] shadow-sm border border-slate-100 flex-1 md:flex-none">
              <div className="bg-slate-50 p-1.5 md:p-2 rounded-lg md:rounded-xl text-slate-400">
                <Search size={16} className="md:w-5 md:h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Quick search student..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="bg-transparent outline-none text-sm font-medium w-full md:w-48"
              />
            </div>
            <button
              onClick={() => navigate('/admin/profile')}
              className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl overflow-hidden border-2 border-indigo-100 hover:border-indigo-600 transition-all shadow-sm hover:shadow-md flex-shrink-0"
            >
              {adminProfile?.profilePic ? (
                <img src={adminProfile.profilePic} alt="Admin" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm md:text-lg">
                  {adminProfile?.name?.charAt(0) || 'A'}
                </div>
              )}
            </button>
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl md:rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              {searchResults.map((student) => (
                <button
                  key={student._id}
                  onClick={() => {
                    navigate(`/admin/students/${student._id}`);
                    setShowSearchResults(false);
                    setSearchQuery("");
                  }}
                  className="w-full p-3 md:p-4 hover:bg-slate-50 transition-colors text-left flex items-center justify-between border-b border-slate-50 last:border-0"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm md:text-base">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.studentId} • {student.email}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 md:w-4 md:h-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <button
            key={i}
            onClick={() => navigate(stat.path)}
            className="group relative bg-white p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden"
          >
            <div className={`h-10 w-10 md:h-14 md:w-14 ${stat.bg} ${stat.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-5 group-hover:scale-110 transition-transform duration-500`}>
              {React.cloneElement(stat.icon, { size: window.innerWidth >= 768 ? 28 : 20 })}
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-xl md:text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
            
            {/* Hover Arrow */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
              <ArrowUpRight size={16} className="md:w-5 md:h-5" />
            </div>
          </button>
        ))}
      </div>

      {/* Live Students & Live Scan Feed - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
        {/* Live Students Section */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
                <div className="h-2 w-2 md:h-3 md:w-3 bg-green-500 rounded-full animate-pulse"></div>
                Live Students
              </h3>
              <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Currently in library</p>
            </div>
            <button 
              onClick={() => navigate('/admin/attendance?filter=live')}
              className="text-[10px] md:text-xs font-black text-green-600 bg-green-50 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl hover:bg-green-100 transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-2 md:space-y-3 max-h-60 md:max-h-80 overflow-y-auto scrollbar-hide">
            {liveStudents.length > 0 ? (
              liveStudents.slice(0, 4).map((student, index) => (
                <div key={index} className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl bg-green-50 border border-green-100 hover:bg-green-100 transition-colors">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="h-8 w-8 md:h-10 md:w-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-black text-xs md:text-sm">
                      {student.seat || '?'}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-xs md:text-sm">{student.name}</p>
                      <p className="text-[10px] md:text-xs text-green-600 font-bold">{student.studentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] md:text-xs font-bold text-green-600">
                      {student.entryTime ? new Date(student.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                    </p>
                    <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-green-500 rounded-full animate-pulse mx-auto mt-1"></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8 text-slate-400">
                <Activity size={24} className="mx-auto mb-2 opacity-50 md:w-8 md:h-8" />
                <p className="text-xs md:text-sm font-bold">No students currently present</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Scan Feed */}
        <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-black text-slate-800">Live Scan Feed</h3>
            <button 
              onClick={() => navigate('/admin/attendance')}
              className="text-[10px] md:text-xs font-black text-indigo-600 bg-indigo-50 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl hover:bg-indigo-100 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-2 md:space-y-3 max-h-60 md:max-h-80 overflow-y-auto scrollbar-hide">
            {dashboardStats.recentScans?.length > 0 ? (
              dashboardStats.recentScans.slice(0, 4).map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-2 md:p-3 rounded-lg md:rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className={`h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center ${scan.type === 'Entry' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {scan.type === 'Entry' ? '→' : '←'}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-xs md:text-sm">{scan.studentName || 'Unknown'}</p>
                      <p className="text-[10px] md:text-xs text-slate-500 font-bold">{scan.studentId || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] md:text-xs font-bold text-slate-600">
                      {scan.time || 'N/A'}
                    </p>
                    <p className={`text-[10px] md:text-xs font-black uppercase ${scan.type === 'Entry' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {scan.type}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 md:py-8 text-slate-400">
                <Activity size={24} className="mx-auto mb-2 opacity-50 md:w-8 md:h-8" />
                <p className="text-xs md:text-sm font-bold">No recent scans</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seat Map & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        {/* Seat Map */}
        <div className="lg:col-span-8 bg-white p-4 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-800">Seat Occupancy Map</h3>
              <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time status</p>
            </div>
            <button 
              onClick={() => navigate('/admin/students')}
              className="text-[10px] md:text-xs font-black text-indigo-600 bg-indigo-50 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Manage Seats
            </button>
          </div>
          
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 md:gap-3">
            {[...Array(dashboardStats.totalSeats || 0)].map((_, i) => {
              const seatNumber = String(i + 1).padStart(2, '0');
              const isOccupied = dashboardStats.occupiedSeats?.includes(seatNumber);
              const isLive = liveStudents.some(s => s.seat === seatNumber);
              
              return (
                <div 
                  key={i} 
                  title={`Seat ${seatNumber} - ${isLive ? 'Live (In Library)' : isOccupied ? 'Occupied' : 'Available'}`}
                  className={`h-6 md:h-8 rounded-md md:rounded-lg cursor-help transition-all hover:scale-125 relative
                    ${isLive ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-100 animate-pulse' : 
                      isOccupied ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-100' : 
                      'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-100'}
                  `} 
                >
                  {isLive && <div className="absolute inset-0 flex items-center justify-center text-white text-[6px] md:text-[8px] font-black">●</div>}
                </div>
              );
            })}
          </div>
          <div className="mt-4 md:mt-8 flex flex-wrap gap-3 md:gap-6">
            <LegendItem color="bg-orange-500 animate-pulse" label="Live (In Library)" />
            <LegendItem color="bg-red-500" label="Occupied" />
            <LegendItem color="bg-green-500" label="Available" />
          </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-4 flex flex-col gap-4 md:gap-6">
          <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-[3rem] text-white relative overflow-hidden group shadow-2xl">
            <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 text-indigo-400">System Health</h3>
            <div className="space-y-3 md:space-y-5 relative z-10">
               <HealthRow label="Server Status" value="Online" color="text-emerald-400" />
               <HealthRow label="Database" value="Synced" color="text-emerald-400" />
               <HealthRow label="Daily Backup" value="Completed" color="text-blue-400" />
            </div>
            <div className="absolute -bottom-10 -right-10 h-24 w-24 md:h-32 md:w-32 bg-indigo-600/20 blur-3xl group-hover:bg-indigo-600/40 transition-all duration-700" />
          </div>

          <button 
            onClick={() => navigate('/admin/settings')}
            className="flex-1 bg-indigo-600 p-4 md:p-8 rounded-2xl md:rounded-[3rem] text-white flex flex-col justify-between group hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            <div className="flex justify-between w-full">
              <div className="bg-white/20 p-2 md:p-3 rounded-xl md:rounded-2xl">{SettingsIcon()}</div>
              <ChevronRight className="group-hover:translate-x-2 transition-transform" size={20} />
            </div>
            <div className="text-left mt-3 md:mt-4">
              <p className="font-black text-lg md:text-xl leading-tight">System Settings</p>
              <p className="text-indigo-200 text-xs font-medium mt-1">Manage library timings & profile</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- Helper Components --- */
const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1 md:gap-2">
    <div className={`h-2 w-2 md:h-3 md:w-3 rounded-full ${color}`} />
    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const HealthRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs md:text-sm font-bold text-slate-400">{label}</span>
    <span className={`text-xs md:text-sm font-black ${color}`}>{value}</span>
  </div>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export default Dashboard;
