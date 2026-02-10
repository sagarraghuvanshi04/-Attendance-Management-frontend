import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, User, Bell, CreditCard, Clock, Lock, Menu, X, MessageSquare, BookOpen, Brain } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../services/api";
import { getCachedData, setCachedData } from "../../services/cache";

const StudentLayout = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    const handleStorageChange = () => {
      fetchUnreadCount();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('notificationsRead', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationsRead', handleStorageChange);
    };
  }, []);

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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-40 px-4 py-3 flex items-center justify-between">
        <div className="text-xl font-black text-indigo-600 italic">SP DIGI LAB</div>
        <div className="flex items-center gap-2">
          <NavLink 
            to="/student/notifications" 
            className="relative p-2 hover:bg-slate-100 rounded-lg"
          >
            <Bell size={20} className="text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </NavLink>
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* SIDEBAR - Desktop */}
      <aside className="w-64 bg-white border-r hidden md:flex flex-col fixed h-full z-30">
        <div className="p-8 text-2xl font-black text-indigo-600 italic">
          SP DIGI LAB
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarLink to="/student/overview" icon={<LayoutDashboard />} label="Overview" />
          <SidebarLink to="/student/profile" icon={<User />} label="My Profile" />
          <SidebarLink to="/student/attendance" icon={<Clock />} label="Attendance" />
          <SidebarLink to="/student/payments" icon={<CreditCard />} label="Payments" />
          <SidebarLink to="/student/books" icon={<BookOpen />} label="Books" />
          <SidebarLink to="/student/quiz" icon={<Brain />} label="Daily Quiz" />
          <SidebarLink 
            to="/student/notifications" 
            icon={<Bell />} 
            label="Notifications" 
            badge={unreadCount}
          />
          <SidebarLink to="/student/complaints" icon={<MessageSquare />} label="Complaints" />
          <SidebarLink to="/student/security" icon={<Lock />} label="Security" />
        </nav>

        <button
          onClick={handleLogout}
          className="m-4 flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl font-semibold"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* SIDEBAR - Mobile Drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 md:hidden flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between border-b">
              <div className="text-2xl font-black text-indigo-600 italic">SP DIGI LAB</div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
              <SidebarLink to="/student/overview" icon={<LayoutDashboard />} label="Overview" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/student/profile" icon={<User />} label="My Profile" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/student/attendance" icon={<Clock />} label="Attendance" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/student/payments" icon={<CreditCard />} label="Payments" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/student/books" icon={<BookOpen />} label="Books" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/student/quiz" icon={<Brain />} label="Daily Quiz" onClick={() => setSidebarOpen(false)} />
              <SidebarLink 
                to="/student/notifications" 
                icon={<Bell />} 
                label="Notifications" 
                badge={unreadCount}
                onClick={() => setSidebarOpen(false)}
              />
              <SidebarLink to="/student/complaints" icon={<MessageSquare />} label="Complaints" onClick={() => setSidebarOpen(false)} />
              <SidebarLink to="/student/security" icon={<Lock />} label="Security" onClick={() => setSidebarOpen(false)} />
            </nav>

            <button
              onClick={handleLogout}
              className="m-4 flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl font-semibold"
            >
              <LogOut size={18} /> Logout
            </button>
          </aside>
        </>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

const SidebarLink = ({ to, icon, label, badge, onClick }) => (
  <NavLink
    to={to}
    end
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 p-3 rounded-xl font-semibold relative ${
        isActive ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
      }`
    }
  >
    {icon}
    {label}
    {badge > 0 && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center animate-pulse">
        {badge > 9 ? "9+" : badge}
      </span>
    )}
  </NavLink>
);

export default StudentLayout;
