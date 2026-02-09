// src/layouts/StaffLayout.jsx
import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  QrCode, Users, MessageSquare, LogOut, 
  Menu, X, Bell, UserCircle, LayoutDashboard,
  CreditCard, Send, Settings, ShieldCheck, BookOpen, Brain, Calendar
} from "lucide-react";

const StaffLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get("/notifications");
      if (data.success) {
        const readNotifications = JSON.parse(localStorage.getItem("staffReadNotifications") || "[]");
        const unread = data.notifications.filter(n => !readNotifications.includes(n._id));
        setUnreadCount(unread.length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/staff/profile");
        if (res.data.success) {
          setStaffInfo(res.data.staff);
        }
      } catch (error) {
        console.error("Failed to fetch profile");
      }
    };
    fetchProfile();

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    // Listen for profile updates
    const handleProfileUpdate = (event) => {
      setStaffInfo(event.detail);
    };
    const handleNotificationsRead = () => {
      fetchUnreadCount();
    };
    window.addEventListener('staffProfileUpdated', handleProfileUpdate);
    window.addEventListener('notificationsRead', handleNotificationsRead);

    return () => {
      clearInterval(interval);
      window.removeEventListener('staffProfileUpdated', handleProfileUpdate);
      window.removeEventListener('notificationsRead', handleNotificationsRead);
    };
  }, []);

  // Aapki requirement ke according menu items
  const menuItems = [
    { path: "/staff/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { path: "/staff/scanner", label: "Scanner", icon: <QrCode size={20} /> },
    { path: "/staff/my-attendance", label: "My Attendance", icon: <Calendar size={20} /> },
    { path: "/staff/attendance", label: "Student Attendance", icon: <Users size={20} /> },
    { path: "/staff/students", label: "Student List", icon: <Users size={20} /> },
    { path: "/staff/payments", label: "Payments", icon: <CreditCard size={20} /> },
    { path: "/staff/complaints", label: "Complaints", icon: <MessageSquare size={20} /> },
    { path: "/staff/books", label: "Books", icon: <BookOpen size={20} /> },
    { path: "/staff/quiz", label: "Quiz", icon: <Brain size={20} /> },
    { path: "/staff/notifications", label: "Broadcast", icon: <Send size={20} /> },
    { path: "/staff/profile", label: "My Profile", icon: <UserCircle size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 p-6 relative z-30">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <ShieldCheck size={24} />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tighter">
            STAFF<span className="text-indigo-600">PANEL</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Menu</p>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${
                location.pathname === item.path 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1" 
                : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
              }`}
            >
              {item.icon} 
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="mt-auto pt-6 border-t border-slate-50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all group"
          >
            <div className="h-8 w-8 bg-rose-100 rounded-lg flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
               <LogOut size={18} />
            </div>
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Modern Top Header */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 z-20">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-600 bg-slate-100 rounded-xl"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">SP Digital Lab / Staff</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Link to="/staff/notifications" className="h-11 w-11 bg-white border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:text-indigo-600 hover:border-indigo-100 transition-all relative group">
              <Bell size={20} className="group-hover:rotate-12 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <div className="h-8 w-[1px] bg-slate-100 mx-2"></div>

            {/* Profile Brief */}
            <Link to="/staff/profile" className="flex items-center gap-3 p-1.5 pr-4 hover:bg-slate-50 rounded-2xl transition-all">
              <div className="h-10 w-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-white font-black text-xs">
                {staffInfo?.profilePic ? (
                  <img src={staffInfo.profilePic} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  staffInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-slate-800 leading-none">{staffInfo?.name || 'Staff'}</p>
                <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1">{staffInfo?.role || 'Staff'}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px]">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* --- Mobile Navigation Drawer --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <nav className="fixed inset-y-0 left-0 w-80 bg-white p-8 shadow-2xl animate-in slide-in-from-left duration-500 flex flex-col">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <ShieldCheck size={24} />
                </div>
                <span className="text-xl font-black text-slate-800 tracking-tight">SP<span className="text-indigo-600">DIGI LAB</span></span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] font-black transition-all ${
                    location.pathname === item.path 
                    ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-200" 
                    : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className={location.pathname === item.path ? "text-white" : "text-indigo-600"}>
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </div>

            <button className="flex items-center justify-center gap-3 w-full bg-rose-50 text-rose-600 py-5 rounded-[2rem] font-black text-sm mt-8">
              <LogOut size={20} /> Logout
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default StaffLayout;