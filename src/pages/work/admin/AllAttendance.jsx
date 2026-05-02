import { useState } from "react";
import { useGetAllAttendanceQuery, useGetAllUsersQuery } from "../../../store/attendanceApi";

export default function AllAttendance() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [userId, setUserId] = useState("");
  const [params, setParams] = useState({});

  const { data, isLoading, isFetching } = useGetAllAttendanceQuery(params);
  const { data: usersData } = useGetAllUsersQuery();

  const records = data?.records || [];
  const users = usersData?.users || [];

  const applyFilter = () => {
    const p = {};
    if (from) p.from = from;
    if (to) p.to = to;
    if (userId) p.userId = userId;
    setParams(p);
  };

  const clearFilter = () => { setFrom(""); setTo(""); setUserId(""); setParams({}); };

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

  const shiftColor = { Completed: "bg-green-100 text-green-700", Incomplete: "bg-yellow-100 text-yellow-700", Absent: "bg-red-100 text-red-600" };
  const validColor = { Valid: "bg-green-100 text-green-700", Invalid: "bg-red-100 text-red-600", Pending: "bg-gray-100 text-gray-600" };
  const otColor = { Approved: "bg-blue-100 text-blue-700", Rejected: "bg-red-100 text-red-600", Pending: "bg-yellow-100 text-yellow-700", None: "bg-gray-100 text-gray-400" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">All Attendance</h1>
        <span className="text-sm text-gray-500">{records.length} records</span>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1 font-medium">User</label>
          <select value={userId} onChange={e => setUserId(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">All Users</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 font-medium">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1 font-medium">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button onClick={applyFilter} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 transition font-medium">Filter</button>
        <button onClick={clearFilter} className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition font-medium">Clear</button>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {(isLoading || isFetching) ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Employee", "Date", "In", "Out", "Hours", "Shift", "Validation", "OT", "Selfie"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-700">{r.employee?.name}</p>
                      <p className="text-xs text-gray-400">{r.employee?.role}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-3">{fmt(r.punchIn)}</td>
                    <td className="px-4 py-3">{fmt(r.punchOut)}</td>
                    <td className="px-4 py-3 font-semibold">{r.workingHours ? `${r.workingHours}h` : "--"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${shiftColor[r.shiftStatus] || "bg-gray-100 text-gray-600"}`}>{r.shiftStatus}</span></td>
                    <td className="px-4 py-3">
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${validColor[r.validationStatus] || "bg-gray-100 text-gray-600"}`}>{r.validationStatus}</span>
                        {r.validationRemarks && <p className="text-xs text-gray-400 mt-0.5">{r.validationRemarks}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${otColor[r.otStatus] || "bg-gray-100 text-gray-500"}`}>{r.otStatus}</span></td>
                    <td className="px-4 py-3">
                      {r.punchInSelfie && (
                        <img src={r.punchInSelfie} alt="selfie" className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:scale-110 transition shadow-sm" onClick={() => window.open(r.punchInSelfie)} />
                      )}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && <tr><td colSpan={9} className="text-center py-10 text-gray-400">No records found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
