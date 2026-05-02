import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../store/authSlice";
import { useGetTodayStatusQuery, useGetMyAttendanceQuery } from "../../../store/attendanceApi";

export default function EmployeeDashboard() {
  const user = useSelector(selectCurrentUser) || {};
  const { data: todayData } = useGetTodayStatusQuery();
  const { data: attData } = useGetMyAttendanceQuery();

  const today = todayData?.record;
  const records = attData?.records || [];

  const totalDays = records.length;
  const completed = records.filter(r => r.shiftStatus === "Completed").length;
  const totalHours = records.reduce((s, r) => s + (r.workingHours || 0), 0).toFixed(1);
  const pendingOT = records.filter(r => r.otStatus === "Pending").length;

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

  const StatCard = ({ label, value, color }) => (
    <div className={`bg-white rounded-2xl shadow p-5 border-l-4 ${color}`}>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{user.department} · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Today Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-4 font-medium">Today's Attendance</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{fmt(today?.punchIn)}</p>
            <p className="text-indigo-200 text-xs mt-1">Punch In</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{fmt(today?.punchOut)}</p>
            <p className="text-indigo-200 text-xs mt-1">Punch Out</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${today?.workingHours >= 8 ? "text-green-300" : "text-yellow-300"}`}>
              {today?.workingHours ? `${today.workingHours}h` : "--"}
            </p>
            <p className="text-indigo-200 text-xs mt-1">Hours</p>
          </div>
        </div>
        {today?.shiftStatus && (
          <div className="mt-4 text-center">
            <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${
              today.shiftStatus === "Completed" ? "bg-green-500/30 text-green-200" : "bg-yellow-500/30 text-yellow-200"
            }`}>
              {today.shiftStatus === "Completed" ? "✅ Full Shift (≥8h)" : "⚠️ Incomplete (<8h)"}
            </span>
          </div>
        )}
        {!today?.punchIn && (
          <div className="mt-4 text-center">
            <span className="text-sm text-indigo-200">You haven't punched in yet today</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Days" value={totalDays} color="border-blue-400" />
        <StatCard label="Completed Shifts" value={completed} color="border-green-400" />
        <StatCard label="Total Hours" value={`${totalHours}h`} color="border-purple-400" />
        <StatCard label="Pending OT" value={pendingOT} color="border-orange-400" />
      </div>

      {/* Recent */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Recent Attendance</h2>
        <div className="space-y-2">
          {records.slice(0, 7).map(r => (
            <div key={r._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                <p className="text-xs text-gray-400">{fmt(r.punchIn)} → {fmt(r.punchOut)} · {r.workingHours || 0}h</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  r.shiftStatus === "Completed" ? "bg-green-100 text-green-700" :
                  r.shiftStatus === "Incomplete" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-600"
                }`}>{r.shiftStatus}</span>
                {r.otStatus !== "None" && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    r.otStatus === "Approved" ? "bg-blue-100 text-blue-700" :
                    r.otStatus === "Rejected" ? "bg-red-100 text-red-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>OT: {r.otStatus}</span>
                )}
              </div>
            </div>
          ))}
          {records.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No attendance records yet. Start by punching in!</p>}
        </div>
      </div>
    </div>
  );
}
