import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../store/authSlice";
import { useGetTodayStatusQuery, useGetAllAttendanceQuery, useGetAllUsersQuery, useGetPendingOTQuery } from "../../../store/attendanceApi";

export default function AdminDashboard() {
  const user = useSelector(selectCurrentUser) || {};
  const todayDate = new Date().toISOString().split("T")[0];

  const { data: todayData } = useGetTodayStatusQuery();
  const { data: attData, isLoading } = useGetAllAttendanceQuery({ date: todayDate });
  const { data: usersData } = useGetAllUsersQuery();
  const { data: otData } = useGetPendingOTQuery();

  const today = todayData?.record;
  const records = attData?.records || [];
  const users = usersData?.users || [];
  const pendingOT = otData?.records || [];

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
  const present = records.filter(r => r.punchIn).length;
  const pendingValidation = records.filter(r => r.validationStatus === "Pending" && r.punchIn).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* My Today */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-5 text-white">
        <p className="text-gray-400 text-sm mb-3 font-medium">My Attendance — {user.name}</p>
        <div className="flex gap-8">
          <div><p className="text-2xl font-bold">{fmt(today?.punchIn)}</p><p className="text-gray-400 text-xs mt-1">Punch In</p></div>
          <div><p className="text-2xl font-bold">{fmt(today?.punchOut)}</p><p className="text-gray-400 text-xs mt-1">Punch Out</p></div>
          <div>
            <p className={`text-2xl font-bold ${today?.workingHours >= 8 ? "text-green-400" : "text-yellow-400"}`}>
              {today?.workingHours ? `${today.workingHours}h` : "--"}
            </p>
            <p className="text-gray-400 text-xs mt-1">Hours</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length, icon: "👤", color: "border-blue-400" },
          { label: "Present Today", value: present, icon: "✅", color: "border-green-400" },
          { label: "Pending OT", value: pendingOT.length, icon: "⚡", color: "border-orange-400" },
          { label: "Pending Validation", value: pendingValidation, icon: "🔍", color: "border-purple-400" },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl shadow p-5 border-l-4 ${s.color}`}>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Role Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { role: "EMPLOYEE", color: "bg-blue-50 border-blue-200 text-blue-700" },
          { role: "MANAGER", color: "bg-purple-50 border-purple-200 text-purple-700" },
          { role: "ADMIN", color: "bg-red-50 border-red-200 text-red-700" },
        ].map(({ role, color }) => (
          <div key={role} className={`rounded-2xl border p-4 text-center ${color}`}>
            <p className="text-2xl font-bold">{users.filter(u => u.role === role).length}</p>
            <p className="text-xs font-medium mt-1">{role}s</p>
          </div>
        ))}
      </div>

      {/* Today's Attendance */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Today's Attendance Overview</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {records.slice(0, 10).map(r => (
              <div key={r._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                    {r.employee?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{r.employee?.name}</p>
                    <p className="text-xs text-gray-400">{r.employee?.role} · {r.employee?.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 hidden sm:block">{fmt(r.punchIn)} → {fmt(r.punchOut)}</span>
                  <span className={`px-2 py-1 rounded-full font-medium ${r.shiftStatus === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {r.shiftStatus}
                  </span>
                  <span className={`px-2 py-1 rounded-full font-medium ${r.validationStatus === "Valid" ? "bg-green-100 text-green-700" : r.validationStatus === "Invalid" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                    {r.validationStatus}
                  </span>
                </div>
              </div>
            ))}
            {records.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No attendance records today</p>}
          </div>
        )}
      </div>
    </div>
  );
}
