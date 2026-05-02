import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../store/authSlice";
import { useGetTodayStatusQuery, useGetTeamAttendanceQuery, useGetPendingOTQuery } from "../../../store/attendanceApi";

export default function ManagerDashboard() {
  const user = useSelector(selectCurrentUser) || {};
  const todayDate = new Date().toISOString().split("T")[0];

  const { data: todayData } = useGetTodayStatusQuery();
  const { data: teamData, isLoading } = useGetTeamAttendanceQuery({ date: todayDate });
  const { data: otData } = useGetPendingOTQuery();

  const today = todayData?.record;
  const team = teamData?.team || [];
  const records = teamData?.records || [];
  const pendingOT = otData?.records || [];

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
  const present = records.filter(r => r.punchIn).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Manager Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">{user.department} · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* My Today */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white">
        <p className="text-purple-200 text-sm mb-3 font-medium">My Attendance Today</p>
        <div className="flex gap-8">
          <div><p className="text-2xl font-bold">{fmt(today?.punchIn)}</p><p className="text-purple-200 text-xs mt-1">Punch In</p></div>
          <div><p className="text-2xl font-bold">{fmt(today?.punchOut)}</p><p className="text-purple-200 text-xs mt-1">Punch Out</p></div>
          <div>
            <p className={`text-2xl font-bold ${today?.workingHours >= 8 ? "text-green-300" : "text-yellow-300"}`}>
              {today?.workingHours ? `${today.workingHours}h` : "--"}
            </p>
            <p className="text-purple-200 text-xs mt-1">Hours</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Team Size", value: team.length, icon: "👥", color: "border-blue-400" },
          { label: "Present Today", value: present, icon: "✅", color: "border-green-400" },
          { label: "Absent Today", value: team.length - present, icon: "❌", color: "border-red-400" },
          { label: "Pending OT", value: pendingOT.length, icon: "⚡", color: "border-orange-400" },
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

      {/* Team Today */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Team Attendance — Today</h2>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {team.map(member => {
              const rec = records.find(r => r.employee?._id === member._id || r.employee === member._id);
              return (
                <div key={member._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                      {member.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {rec?.punchIn ? (
                      <>
                        <span className="text-gray-500 hidden sm:block">{fmt(rec.punchIn)} → {fmt(rec.punchOut)}</span>
                        <span className={`px-2 py-1 rounded-full font-medium ${rec.shiftStatus === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {rec.shiftStatus}
                        </span>
                      </>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 font-medium">Absent</span>
                    )}
                  </div>
                </div>
              );
            })}
            {team.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No team members assigned to you yet</p>}
          </div>
        )}
      </div>
    </div>
  );
}
