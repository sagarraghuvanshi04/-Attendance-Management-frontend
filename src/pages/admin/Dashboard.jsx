// src/pages/admin/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, IndianRupee, MapPin, Zap, 
  ArrowUpRight, Activity, ChevronRight, Search 
} from "lucide-react";
import api from "../../services/api"; // your axios instance
import toast from "react-hot-toast";

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
      const attendanceRes = await api.get("/attendance/live");
      if (attendanceRes.data.success) {
        setLiveStudents(attendanceRes.data.liveStudents || []);
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
    { label: "Live Students", value: dashboardStats.activeStudents, icon: <Activity />, color: "text-emerald-600", bg: "bg-emerald-50", path: "/admin/students" },
    { label: "Available Seats", value: dashboardStats.availableSeats, icon: <MapPin />, color: "text-purple-600", bg: "bg-purple-50", path: "/admin/students" },
    { label: "Active Staff", value: dashboardStats.totalStaff, icon: <Zap />, color: "text-amber-600", bg: "bg-amber-50", path: "/admin/teachers" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 px-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Library <span className="text-indigo-600">Command</span>
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            <Activity size={16} className="text-emerald-500" /> 
            Everything is running smoothly today
          </p>
        </div>
        
        <div className="relative w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 flex-1 md:flex-none">
              <div className="bg-slate-50 p-2 rounded-xl text-slate-400">
                <Search size={20} />
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
              className="h-12 w-12 rounded-xl overflow-hidden border-2 border-indigo-100 hover:border-indigo-600 transition-all shadow-sm hover:shadow-md flex-shrink-0"
            >
              {adminProfile?.profilePic ? (
                <img src={adminProfile.profilePic} alt="Admin" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                  {adminProfile?.name?.charAt(0) || 'A'}
                </div>
              )}
            </button>
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              {searchResults.map((student) => (
                <button
                  key={student._id}
                  onClick={() => {
                    navigate(`/admin/students/${student._id}`);
                    setShowSearchResults(false);
                    setSearchQuery("");
                  }}
                  className="w-full p-4 hover:bg-slate-50 transition-colors text-left flex items-center justify-between border-b border-slate-50 last:border-0"
                >
                  <div>
                    <p className="font-bold text-slate-800">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.studentId} • {student.email}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <button
            key={i}
            onClick={() => navigate(stat.path)}
            className="group relative bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden"
          >
            <div className={`h-14 w-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
              {React.cloneElement(stat.icon, { size: 28 })}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
            
            {/* Hover Arrow */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
              <ArrowUpRight size={20} />
            </div>
          </button>
        ))}
      </div>

      {/* Seat Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800">Seat Occupancy Map</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time status</p>
            </div>
            <button 
              onClick={() => navigate('/admin/students')}
              className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Manage Seats
            </button>
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {[...Array(dashboardStats.totalSeats || 0)].map((_, i) => {
              const seatNumber = String(i + 1).padStart(2, '0');
              const isOccupied = dashboardStats.occupiedSeats?.includes(seatNumber);
              const isLive = liveStudents.some(s => s.seat === seatNumber);
              
              return (
                <div 
                  key={i} 
                  title={`Seat ${seatNumber} - ${isLive ? 'Live (In Library)' : isOccupied ? 'Occupied' : 'Available'}`}
                  className={`h-8 rounded-lg cursor-help transition-all hover:scale-125 relative
                    ${isLive ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-100 animate-pulse' : 
                      isOccupied ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-100' : 
                      'bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-100'}
                  `} 
                >
                  {isLive && <div className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-black">●</div>}
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex gap-6">
            <LegendItem color="bg-orange-500 animate-pulse" label="Live (In Library)" />
            <LegendItem color="bg-red-500" label="Occupied" />
            <LegendItem color="bg-green-500" label="Available" />
          </div>
        </div>

        {/* System Health */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden group shadow-2xl">
            <h3 className="text-xl font-black mb-6 text-indigo-400">System Health</h3>
            <div className="space-y-5 relative z-10">
               <HealthRow label="Server Status" value="Online" color="text-emerald-400" />
               <HealthRow label="Database" value="Synced" color="text-emerald-400" />
               <HealthRow label="Daily Backup" value="Completed" color="text-blue-400" />
            </div>
            <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-600/20 blur-3xl group-hover:bg-indigo-600/40 transition-all duration-700" />
          </div>

          <button 
            onClick={() => navigate('/admin/settings')}
            className="flex-1 bg-indigo-600 p-8 rounded-[3rem] text-white flex flex-col justify-between group hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            <div className="flex justify-between w-full">
              <div className="bg-white/20 p-3 rounded-2xl">{SettingsIcon()}</div>
              <ChevronRight className="group-hover:translate-x-2 transition-transform" />
            </div>
            <div className="text-left mt-4">
              <p className="font-black text-xl leading-tight">System Settings</p>
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
  <div className="flex items-center gap-2">
    <div className={`h-3 w-3 rounded-full ${color}`} />
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

const HealthRow = ({ label, value, color }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-sm font-bold text-slate-400">{label}</span>
    <span className={`text-sm font-black ${color}`}>{value}</span>
  </div>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export default Dashboard;
