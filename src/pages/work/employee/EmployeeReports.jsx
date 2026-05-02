import { useState } from "react";
import { useGetDailyReportQuery } from "../../../store/attendanceApi";

export default function EmployeeReports() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading, isFetching } = useGetDailyReportQuery({ date: queryDate });
  const records = data?.records || [];

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Daily Report</h1>

      <div className="bg-white rounded-2xl shadow p-4 flex gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1 font-medium">Select Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button onClick={() => setQueryDate(date)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 transition font-medium">
          Generate Report
        </button>
      </div>

      {(isLoading || isFetching) ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl px-5 py-3 border">
            <p className="font-semibold text-gray-700">
              {new Date(queryDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {records.map(r => (
            <div key={r._id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex flex-wrap gap-6">
                <div className="flex-1 min-w-52 space-y-3">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{r.employee?.name}</p>
                    <p className="text-sm text-gray-500">{r.employee?.department}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-green-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">Punch In</p>
                      <p className="font-bold text-gray-800">{fmt(r.punchIn)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">Punch Out</p>
                      <p className="font-bold text-gray-800">{fmt(r.punchOut)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">Working Hours</p>
                      <p className={`font-bold ${r.workingHours >= 8 ? "text-green-600" : "text-orange-500"}`}>{r.workingHours || 0}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400">Shift Status</p>
                      <p className={`font-bold text-sm ${r.shiftStatus === "Completed" ? "text-green-600" : "text-yellow-600"}`}>{r.shiftStatus}</p>
                    </div>
                  </div>
                  {r.punchInLocation?.latitude && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                      <span>📍</span>
                      <span>{r.punchInLocation.latitude.toFixed(5)}, {r.punchInLocation.longitude.toFixed(5)}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.validationStatus === "Valid" ? "bg-green-100 text-green-700" : r.validationStatus === "Invalid" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                      {r.validationStatus}
                    </span>
                    {r.validationRemarks && <span className="text-xs text-gray-400 self-center">{r.validationRemarks}</span>}
                  </div>
                </div>
                <div className="flex gap-3">
                  {r.punchInSelfie && (
                    <div className="text-center">
                      <img src={r.punchInSelfie} alt="in" className="w-24 h-24 rounded-xl object-cover border-2 border-green-300 cursor-pointer hover:scale-105 transition" onClick={() => window.open(r.punchInSelfie)} />
                      <p className="text-xs text-gray-400 mt-1">Punch In</p>
                    </div>
                  )}
                  {r.punchOutSelfie && (
                    <div className="text-center">
                      <img src={r.punchOutSelfie} alt="out" className="w-24 h-24 rounded-xl object-cover border-2 border-red-300 cursor-pointer hover:scale-105 transition" onClick={() => window.open(r.punchOutSelfie)} />
                      <p className="text-xs text-gray-400 mt-1">Punch Out</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-400">
              No attendance record for this date
            </div>
          )}
        </div>
      )}
    </div>
  );
}
