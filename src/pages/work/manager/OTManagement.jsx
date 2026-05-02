import { useGetPendingOTQuery, useHandleOTMutation } from "../../../store/attendanceApi";
import toast from "react-hot-toast";

export default function OTManagement() {
  const { data, isLoading, refetch } = useGetPendingOTQuery();
  const [handleOT, { isLoading: acting }] = useHandleOTMutation();
  const records = data?.records || [];

  const handle = async (id, action) => {
    const remarks = action === "Rejected" ? (prompt("Rejection reason (optional):") || "") : "";
    try {
      await handleOT({ id, action, remarks }).unwrap();
      toast.success(`OT ${action}`);
    } catch (err) {
      toast.error(err.data?.message || "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Overtime Requests</h1>
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">{records.length} Pending</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {records.map(r => (
            <div key={r._id} className="bg-white rounded-2xl shadow p-6 hover:shadow-md transition">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                    {r.employee?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{r.employee?.name}</p>
                    <p className="text-sm text-gray-500">{r.employee?.department}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg">⚡ {r.otHours}h OT</span>
                      <span className="text-xs text-gray-500">Working: {r.workingHours}h</span>
                    </div>
                    {r.otRemarks && <p className="text-sm text-gray-600 mt-2 italic">"{r.otRemarks}"</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handle(r._id, "Approved")} disabled={acting}
                    className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-green-700 transition disabled:opacity-60 font-medium">
                    ✅ Approve
                  </button>
                  <button onClick={() => handle(r._id, "Rejected")} disabled={acting}
                    className="bg-red-500 text-white px-5 py-2 rounded-xl text-sm hover:bg-red-600 transition disabled:opacity-60 font-medium">
                    ❌ Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          {records.length === 0 && (
            <div className="bg-white rounded-2xl shadow p-16 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-gray-500 font-medium">No pending OT requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
