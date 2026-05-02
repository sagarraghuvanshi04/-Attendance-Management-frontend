import { useState } from "react";
import { useGetDailyReportQuery } from "../../../store/attendanceApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminReports() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading, isFetching } = useGetDailyReportQuery({ date: queryDate });
  const records = data?.records || [];

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
  const completed = records.filter(r => r.shiftStatus === "Completed").length;
  const totalHours = records.reduce((s, r) => s + (r.workingHours || 0), 0).toFixed(1);
  const valid = records.filter(r => r.validationStatus === "Valid").length;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Attendance Report — ${new Date(queryDate).toLocaleDateString()}`, 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Name", "Role", "Dept", "Punch In", "Punch Out", "Hours", "Shift", "Validation"]],
      body: records.map(r => [
        r.employee?.name || "",
        r.employee?.role || "",
        r.employee?.department || "",
        fmt(r.punchIn),
        fmt(r.punchOut),
        `${r.workingHours || 0}h`,
        r.shiftStatus,
        r.validationStatus,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });
    doc.save(`attendance-report-${queryDate}.pdf`);
  };

  const exportCSV = () => {
    const headers = ["Name", "Role", "Department", "Punch In", "Punch Out", "Working Hours", "Shift Status", "Validation", "Location"];
    const rows = records.map(r => [
      r.employee?.name || "",
      r.employee?.role || "",
      r.employee?.department || "",
      r.punchIn ? new Date(r.punchIn).toLocaleString() : "",
      r.punchOut ? new Date(r.punchOut).toLocaleString() : "",
      r.workingHours || 0,
      r.shiftStatus,
      r.validationStatus,
      r.punchInLocation?.latitude ? `${r.punchInLocation.latitude},${r.punchInLocation.longitude}` : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `attendance-report-${queryDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">System-Wide Daily Report</h1>

      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1 font-medium">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button onClick={() => setQueryDate(date)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-indigo-700 transition font-medium">
          Generate Report
        </button>
        {records.length > 0 && (
          <>
            <button onClick={exportPDF}
              className="bg-red-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-red-700 transition font-medium">
              📄 Export PDF
            </button>
            <button onClick={exportCSV}
              className="bg-green-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-green-700 transition font-medium">
              📊 Export CSV
            </button>
          </>
        )}
      </div>

      {(isLoading || isFetching) ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Records", value: records.length, color: "border-blue-400" },
              { label: "Completed Shifts", value: completed, color: "border-green-400" },
              { label: "Total Hours", value: `${totalHours}h`, color: "border-purple-400" },
              { label: "Validated", value: valid, color: "border-teal-400" },
            ].map(s => (
              <div key={s.label} className={`bg-white rounded-2xl shadow p-4 text-center border-l-4 ${s.color}`}>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <p className="font-semibold text-gray-700">{new Date(queryDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <span className="text-sm text-gray-500">{records.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {["Name", "Role", "Dept", "In", "Out", "Hours", "Shift", "Location", "Selfie", "Validation"].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-3 font-medium text-gray-700">{r.employee?.name}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.employee?.role === "ADMIN" ? "bg-red-100 text-red-700" : r.employee?.role === "MANAGER" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                          {r.employee?.role}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-xs">{r.employee?.department}</td>
                      <td className="px-3 py-3">{fmt(r.punchIn)}</td>
                      <td className="px-3 py-3">{fmt(r.punchOut)}</td>
                      <td className="px-3 py-3 font-semibold">{r.workingHours || 0}h</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.shiftStatus === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {r.shiftStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-400">
                        {r.punchInLocation?.latitude ? `${r.punchInLocation.latitude.toFixed(3)}, ${r.punchInLocation.longitude.toFixed(3)}` : "--"}
                      </td>
                      <td className="px-3 py-3">
                        {r.punchInSelfie && (
                          <img src={r.punchInSelfie} alt="selfie" className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:scale-110 transition" onClick={() => window.open(r.punchInSelfie)} />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.validationStatus === "Valid" ? "bg-green-100 text-green-700" : r.validationStatus === "Invalid" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                            {r.validationStatus}
                          </span>
                          {r.validationRemarks && <p className="text-xs text-gray-400 mt-0.5">{r.validationRemarks}</p>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && <tr><td colSpan={10} className="text-center py-10 text-gray-400">No records for this date</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
