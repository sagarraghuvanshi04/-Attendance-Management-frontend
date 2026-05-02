import { useState } from "react";
import { useGetTeamAttendanceQuery } from "../../../store/attendanceApi";

export default function TeamAttendance() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [params, setParams] = useState({});

  const { data, isLoading, isFetching } = useGetTeamAttendanceQuery(params);
  const records = data?.records || [];

  const applyFilter = () => {
    const p = {};
    if (from) p.from = from;
    if (to) p.to = to;
    setParams(p);
  };

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Team Attendance</h1>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 items-end">
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
        <button onClick={() => { setFrom(""); setTo(""); setParams({}); }} className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition font-medium">Clear</button>
        <span className="text-xs text-gray-400 ml-auto self-center">{records.length} records</span>
      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {(isLoading || isFetching) ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Employee", "Date", "Punch In", "Punch Out", "Hours", "Shift", "Validation"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                          {r.employee?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{r.employee?.name}</p>
                          <p className="text-xs text-gray-400">{r.employee?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(r.punchIn)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(r.punchOut)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{r.workingHours ? `${r.workingHours}h` : "--"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.shiftStatus === "Completed" ? "bg-green-100 text-green-700" : r.shiftStatus === "Incomplete" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                        {r.shiftStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.validationStatus === "Valid" ? "bg-green-100 text-green-700" : r.validationStatus === "Invalid" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                        {r.validationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">No records found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
