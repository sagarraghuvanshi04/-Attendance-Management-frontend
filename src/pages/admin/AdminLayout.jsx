// src/components/Admin/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  LayoutDashboard, Users, GraduationCap, 
  CreditCard, FileBarChart, Settings, LogOut, Library, Calendar, Bell, BookOpen, Brain, DollarSign, MessageSquare, UserCircle, Mail, Eye
} from "lucide-react";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

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

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get("/notifications");
      if (data.success) {
        const readNotifications = JSON.parse(localStorage.getItem("adminReadNotifications") || "[]");
        const unread = data.notifications.filter(n => !readNotifications.includes(n._id));
        setUnreadCount(unread.length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

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
  // Remove token and user data
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  navigate("/");
};


  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col p-6 sticky top-0 h-screen">
        <div className="px-2 mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Library size={24} />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">SP Digital Lab</span>
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
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all relative ${
                location.pathname === item.path
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon}
              {item.label}
              {item.label === "Notifications" && unreadCount > 0 && (
                <span className="absolute right-3 h-5 w-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-pulse">
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
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;