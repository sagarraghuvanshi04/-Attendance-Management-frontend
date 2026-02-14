// src/components/Admin/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  LayoutDashboard, Users, GraduationCap, 
  CreditCard, FileBarChart, Settings, LogOut, Library, Calendar, Bell, BookOpen, Brain, DollarSign, MessageSquare, UserCircle, Mail, Eye, Menu, X
} from "lucide-react";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get("/notifications");
      if (data.success) {
        const unread = data.notifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    const handleNotificationsRead = () => {
      fetchUnreadCount();
    };
    window.addEventListener('notificationsRead', handleNotificationsRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationsRead', handleNotificationsRead);
    };
  }, []);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/admin" },
    { icon: <Users size={20} />, label: "Manage Students", path: "/admin/students" },
    { icon: <GraduationCap size={20} />, label: "Manage Staff", path: "/admin/teachers" },
    { icon: <CreditCard size={20} />, label: "Payments", path: "/admin/payments" },
    { icon: <Calendar size={20} />, label: "Attendance", path: "/admin/attendance" },
    { icon: <Eye size={20} />, label: "Attendance Viewer", path: "/admin/attendance-view" },
    { icon: <MessageSquare size={20} />, label: "Complaints", path: "/admin/complaints" },
    { icon: <BookOpen size={20} />, label: "Books", path: "/admin/books" },
    { icon: <Brain size={20} />, label: "Quiz", path: "/admin/quiz" },
    { icon: <DollarSign size={20} />, label: "Fee Management", path: "/admin/fee-management" },
    { icon: <Mail size={20} />, label: "Payment Reminders", path: "/admin/payment-reminders" },
    { icon: <Bell size={20} />, label: "Notifications", path: "/admin/notifications" },
    { icon: <FileBarChart size={20} />, label: "Reports", path: "/admin/reports" },
    { icon: <UserCircle size={20} />, label: "Profile", path: "/admin/profile" },
    { icon: <Settings size={20} />, label: "Settings", path: "/admin/settings" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`w-72 bg-white border-r border-slate-100 flex flex-col p-6 h-screen transition-transform duration-300 z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:sticky lg:top-0`}>
        <div className="px-2 mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Library size={24} />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">SP Digital Lab</span>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <X size={20} className="text-slate-600" />
            </button>
          </div>
          <div className="ml-11">
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg uppercase tracking-wider">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                location.pathname === item.path
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.label === "Notifications" && unreadCount > 0 && (
                <span className="h-5 w-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-pulse flex-shrink-0">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 mt-auto text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 lg:px-8 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} className="text-slate-600" />
            </button>
            <h1 className="text-xl lg:text-2xl font-black text-slate-800">Admin Panel</h1>
          </div>
          <Link to="/admin/notifications" className="relative p-3 hover:bg-slate-100 rounded-xl transition-all">
            <Bell size={24} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
