import { useState } from "react";
import { useGetTodayStatusQuery, useGetMyAttendanceQuery, useRequestOTMutation } from "../../../store/attendanceApi";
import toast from "react-hot-toast";

export default function EmployeeOvertime() {
  const { data: todayData, refetch: refetchToday } = useGetTodayStatusQuery();
  const { data: attData, refetch: refetchAtt } = useGetMyAttendanceQuery();
  const [requestOT, { isLoading }] = useRequestOTMutation();

  const [otHours, setOtHours] = useState(1);
  const [otRemarks, setOtRemarks] = useState("");

  const today = todayData?.record;
  const records = attData?.records || [];
  const otRecords = records.filter(r => r.otStatus !== "None");

  const canRequest = today?.punchIn && today?.otStatus !== "Pending" && today?.otStatus !== "Approved";

  const submit = async (e) => {
    e.preventDefault();
    try {
      await requestOT({ otHours: Number(otHours), otRemarks }).unwrap();
      toast.success("OT request submitted!");
      setOtRemarks("");
      refetchToday();
      refetchAtt();
    } catch (err) {
      toast.error(err.data?.message || "Failed");
    }
  };

  const statusColor = { Approved: "bg-green-100 text-green-700", Rejected: "bg-red-100 text-red-600", Pending: "bg-yellow-100 text-yellow-700" };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Overtime Requests</h1>

      {/* Today OT Status */}
      {today?.otStatus && today.otStatus !== "None" && (
        <div className={`rounded-2xl p-4 border ${today.otStatus === "Approved" ? "bg-green-50 border-green-200" : today.otStatus === "Rejected" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
          <p className="font-semibold text-gray-700">Today's OT Request</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[today.otStatus]}`}>{today.otStatus}</span>
            <span className="text-sm text-gray-600">{today.otHours}h requested</span>
            {today.otRemarks && <span className="text-xs text-gray-500">· {today.otRemarks}</span>}
          </div>
        </div>
      )}

      {/* Request Form */}
      {canRequest ? (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Request Overtime for Today</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">OT Hours Requested</label>
              <input type="number" min={0.5} max={8} step={0.5} value={otHours}
                onChange={e => setOtHours(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Reason</label>
              <textarea value={otRemarks} onChange={e => setOtRemarks(e.target.value)} rows={3}
                placeholder="Describe the reason for overtime..."
                className="border border-gray-200 rounded-xl px-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-sm" />
            </div>
            <button type="submit" disabled={isLoading}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-60 text-sm">
              {isLoading ? "Submitting..." : "⚡ Submit OT Request"}
            </button>
          </form>
        </div>
      ) : (
        <div className={`rounded-2xl p-4 border text-sm font-medium ${
          !today?.punchIn ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-blue-50 border-blue-200 text-blue-700"
        }`}>
          {!today?.punchIn ? "⚠️ You must punch in before requesting overtime." : `ℹ️ OT already ${today?.otStatus?.toLowerCase()} for today.`}
        </div>
      )}

      {/* OT History */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-semibold text-gray-700 mb-4">OT History ({otRecords.length})</h2>
        <div className="space-y-3">
          {otRecords.map(r => (
            <div key={r._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
              <div>
                <p className="font-medium text-gray-700 text-sm">{new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.otHours}h requested · {r.otRemarks || "No reason provided"}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[r.otStatus] || "bg-gray-100 text-gray-600"}`}>
                {r.otStatus}
              </span>
            </div>
          ))}
          {otRecords.length === 0 && <p className="text-gray-400 text-sm text-center py-6">No overtime requests yet</p>}
        </div>
      </div>
    </div>
  );
}
