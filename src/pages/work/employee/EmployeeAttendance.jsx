import { useState } from "react";
import { useGetMyAttendanceQuery } from "../../../store/attendanceApi";

export default function EmployeeAttendance() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [params, setParams] = useState({});

  const { data, isLoading, isFetching } = useGetMyAttendanceQuery(params);
  const records = data?.records || [];

  const applyFilter = () => {
    const p = {};
    if (from) p.from = from;
    if (to) p.to = to;
    setParams(p);
  };

  const clearFilter = () => { setFrom(""); setTo(""); setParams({}); };

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

  const Badge = ({ value, map }) => {
    const cfg = map[value] || "bg-gray-100 text-gray-600";
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg}`}>{value}</span>;
  };

  const shiftMap = { Completed: "bg-green-100 text-green-700", Incomplete: "bg-yellow-100 text-yellow-700", Absent: "bg-red-100 text-red-600" };
  const validMap = { Valid: "bg-green-100 text-green-700", Invalid: "bg-red-100 text-red-600", Pending: "bg-gray-100 text-gray-600" };
  const otMap = { Approved: "bg-blue-100 text-blue-700", Rejected: "bg-red-100 text-red-600", Pending: "bg-yellow-100 text-yellow-700", None: "bg-gray-100 text-gray-400" };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>

      {/* Filters */}
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
        <button onClick={applyFilter} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 transition font-medium">
          Apply Filter
        </button>
        <button onClick={clearFilter} className="bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition font-medium">
          Clear
        </button>
        <span className="text-xs text-gray-400 ml-auto self-center">{records.length} records</span>
      </div>

      {/* Summary */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Completed", value: records.filter(r => r.shiftStatus === "Completed").length, color: "text-green-600" },
            { label: "Incomplete", value: records.filter(r => r.shiftStatus === "Incomplete").length, color: "text-yellow-600" },
            { label: "Total Hours", value: `${records.reduce((s, r) => s + (r.workingHours || 0), 0).toFixed(1)}h`, color: "text-blue-600" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl shadow p-4 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {(isLoading || isFetching) ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Date", "Punch In", "Punch Out", "Hours", "Shift", "Validation", "OT Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-700">{new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(r.punchIn)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(r.punchOut)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{r.workingHours ? `${r.workingHours}h` : "--"}</td>
                    <td className="px-4 py-3"><Badge value={r.shiftStatus} map={shiftMap} /></td>
                    <td className="px-4 py-3">
                      <div>
                        <Badge value={r.validationStatus} map={validMap} />
                        {r.validationRemarks && <p className="text-xs text-gray-400 mt-1">{r.validationRemarks}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge value={r.otStatus} map={otMap} /></td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
