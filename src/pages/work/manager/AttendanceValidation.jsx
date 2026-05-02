import { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../store/authSlice";
import { useGetTeamAttendanceQuery, useGetAllAttendanceQuery, useValidateAttendanceMutation } from "../../../store/attendanceApi";
import toast from "react-hot-toast";

export default function AttendanceValidation() {
  const user = useSelector(selectCurrentUser) || {};
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState({});

  const isAdmin = user.role === "ADMIN";
  const teamQuery = useGetTeamAttendanceQuery({ date: queryDate }, { skip: isAdmin });
  const adminQuery = useGetAllAttendanceQuery({ date: queryDate }, { skip: !isAdmin });

  const activeQuery = isAdmin ? adminQuery : teamQuery;
  const allRecords = activeQuery.data?.records || [];
  const records = allRecords.filter(r => r.punchIn);

  const [validate, { isLoading }] = useValidateAttendanceMutation();

  const handleValidate = async (id, status) => {
    try {
      await validate({ id, validationStatus: status, validationRemarks: remarks[id] || "" }).unwrap();
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error(err.data?.message || "Failed");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Attendance Validation</h1>

      <div className="bg-white rounded-2xl shadow p-4 flex gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1 font-medium">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button onClick={() => setQueryDate(date)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 transition font-medium">
          Load
        </button>
        <span className="text-xs text-gray-400 self-center ml-auto">{records.length} records with punch-in</span>
      </div>

      {activeQuery.isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {records.map(r => (
            <div key={r._id} className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
              <div className="flex flex-wrap gap-6">
                {/* Info */}
                <div className="flex-1 min-w-52 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                      {r.employee?.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{r.employee?.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.validationStatus === "Valid" ? "bg-green-100 text-green-700" :
                          r.validationStatus === "Invalid" ? "bg-red-100 text-red-600" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>{r.validationStatus}</span>
                      </div>
                      <p className="text-xs text-gray-500">{r.employee?.department}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-400 text-xs">In:</span> <span className="font-medium">{fmt(r.punchIn)}</span></div>
                    <div><span className="text-gray-400 text-xs">Out:</span> <span className="font-medium">{fmt(r.punchOut)}</span></div>
                    <div><span className="text-gray-400 text-xs">Hours:</span> <span className={`font-medium ${r.workingHours >= 8 ? "text-green-600" : "text-orange-500"}`}>{r.workingHours}h</span></div>
                    <div><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.shiftStatus === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{r.shiftStatus}</span></div>
                  </div>
                  {r.punchInLocation?.latitude && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span>📍</span> {r.punchInLocation.latitude.toFixed(5)}, {r.punchInLocation.longitude.toFixed(5)}
                    </p>
                  )}
                  {r.validationRemarks && <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">Remarks: {r.validationRemarks}</p>}
                </div>

                {/* Selfies */}
                <div className="flex gap-3">
                  {r.punchInSelfie && (
                    <div className="text-center">
                      <img src={r.punchInSelfie} alt="punch-in"
                        className="w-28 h-28 rounded-xl object-cover border-2 border-green-300 cursor-pointer hover:scale-105 transition shadow-sm"
                        onClick={() => window.open(r.punchInSelfie)} />
                      <p className="text-xs text-gray-400 mt-1">Punch In</p>
                    </div>
                  )}
                  {r.punchOutSelfie && (
                    <div className="text-center">
                      <img src={r.punchOutSelfie} alt="punch-out"
                        className="w-28 h-28 rounded-xl object-cover border-2 border-red-300 cursor-pointer hover:scale-105 transition shadow-sm"
                        onClick={() => window.open(r.punchOutSelfie)} />
                      <p className="text-xs text-gray-400 mt-1">Punch Out</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 min-w-44">
                  <textarea
                    value={remarks[r._id] || ""}
                    onChange={e => setRemarks(rm => ({ ...rm, [r._id]: e.target.value }))}
                    placeholder="Add remarks..."
                    rows={3}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                  <button onClick={() => handleValidate(r._id, "Valid")} disabled={isLoading}
                    className="bg-green-600 text-white py-2 rounded-xl text-sm hover:bg-green-700 transition disabled:opacity-60 font-medium">
                    ✅ Mark Valid
                  </button>
                  <button onClick={() => handleValidate(r._id, "Invalid")} disabled={isLoading}
                    className="bg-red-500 text-white py-2 rounded-xl text-sm hover:bg-red-600 transition disabled:opacity-60 font-medium">
                    ❌ Mark Invalid
                  </button>
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-16 text-center text-gray-400">
              No attendance records with punch-in for this date
            </div>
          )}
        </div>
      )}
    </div>
  );
}
