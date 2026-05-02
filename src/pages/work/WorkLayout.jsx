import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectCurrentUser } from "../../store/authSlice";
import { useGetNotificationsQuery } from "../../store/attendanceApi";
import toast from "react-hot-toast";

const navItems = {
  EMPLOYEE: [
    { to: "/work/employee/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/work/employee/punch", label: "Punch In/Out", icon: "⏱️" },
    { to: "/work/employee/attendance", label: "My Attendance", icon: "📋" },
    { to: "/work/employee/overtime", label: "Overtime", icon: "⚡" },
    { to: "/work/employee/reports", label: "Reports", icon: "📊" },
    { to: "/work/employee/notifications", label: "Notifications", icon: "🔔" },
  ],
  MANAGER: [
    { to: "/work/manager/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/work/manager/punch", label: "Punch In/Out", icon: "⏱️" },
    { to: "/work/manager/team", label: "Team Attendance", icon: "👥" },
    { to: "/work/manager/overtime", label: "OT Requests", icon: "⚡" },
    { to: "/work/manager/validate", label: "Validate", icon: "✅" },
    { to: "/work/manager/reports", label: "Reports", icon: "📊" },
    { to: "/work/manager/notifications", label: "Notifications", icon: "🔔" },
  ],
  ADMIN: [
    { to: "/work/admin/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/work/admin/punch", label: "Punch In/Out", icon: "⏱️" },
    { to: "/work/admin/users", label: "Manage Users", icon: "👤" },
    { to: "/work/admin/attendance", label: "All Attendance", icon: "📋" },
    { to: "/work/admin/overtime", label: "OT Requests", icon: "⚡" },
    { to: "/work/admin/validate", label: "Validate", icon: "✅" },
    { to: "/work/admin/reports", label: "Reports", icon: "📊" },
    { to: "/work/admin/notifications", label: "Notifications", icon: "🔔" },
  ],
};

export default function WorkLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser) || {};
  const items = navItems[user.role] || [];
  const { data: notifData } = useGetNotificationsQuery();
  const unreadCount = notifData?.unreadCount || 0;

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out");
    navigate("/work/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-40 w-64 h-full bg-white shadow-lg flex flex-col transition-transform duration-300`}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <h2 className="text-base font-bold text-indigo-700">AttendTrack</h2>
          </div>
          <p className="text-xs text-gray-500 truncate">{user.name}</p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            user.role === "ADMIN" ? "bg-red-100 text-red-700" :
            user.role === "MANAGER" ? "bg-purple-100 text-purple-700" :
            "bg-blue-100 text-blue-700"
          }`}>{user.role}</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {items.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${isActive ? "bg-indigo-600 text-white shadow-sm" : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"}`
              }>
              <span className="text-base">{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="px-4 py-2 mb-2 text-xs text-gray-400">
            <p className="truncate">{user.email}</p>
            {user.department && <p>{user.department}</p>}
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition font-medium">
            🚪 Logout
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <button className="md:hidden text-gray-600" onClick={() => setOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden md:block">
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {/* Notification Bell */}
            <NavLink to={`/work/${user.role?.toLowerCase()}/notifications`} className="relative">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition">
                <span className="text-lg">🔔</span>
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </NavLink>
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
