import React, { useState } from "react";
import { Calendar, Users, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const ManualAttendance = ({ onAttendanceAdded }) => {
  const [tab, setTab] = useState("entry");
  const [studentId, setStudentId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("Present");
  const [entryTime, setEntryTime] = useState(new Date().toTimeString().slice(0, 5));
  const [exitTime, setExitTime] = useState(new Date().toTimeString().slice(0, 5));
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      setEntryTime(now.toTimeString().slice(0, 5));
      setExitTime(now.toTimeString().slice(0, 5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddEntry = async (e) => {
    e.preventDefault();

    if (!studentId || !date || !status) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const entryDateTime = new Date(date);
      const [entryHours, entryMinutes] = entryTime.split(":");
      entryDateTime.setHours(parseInt(entryHours), parseInt(entryMinutes), 0);

      let exitDateTime = null;
      if (exitTime) {
        exitDateTime = new Date(date);
        const [exitHours, exitMinutes] = exitTime.split(":");
        exitDateTime.setHours(parseInt(exitHours), parseInt(exitMinutes), 0);
      }

      const res = await api.post("/attendance/manual-add", {
        studentId,
        date,
        status,
        entryTime: entryDateTime.toISOString(),
        exitTime: exitDateTime ? exitDateTime.toISOString() : null,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setStudentId("");
        setDate(new Date().toISOString().split("T")[0]);
        setStatus("Present");
        setEntryTime(new Date().toTimeString().slice(0, 5));
        setExitTime(new Date().toTimeString().slice(0, 5));
        if (onAttendanceAdded) onAttendanceAdded();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExit = async (e) => {
    e.preventDefault();

    if (!studentId || !date || !exitTime) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const exitDateTime = new Date(date);
      const [hours, minutes] = exitTime.split(":");
      exitDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const res = await api.post("/attendance/manual-exit", {
        studentId,
        date,
        exitTime: exitDateTime.toISOString(),
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setStudentId("");
        setDate(new Date().toISOString().split("T")[0]);
        setExitTime(new Date().toTimeString().slice(0, 5));
        if (onAttendanceAdded) onAttendanceAdded();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add exit time");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-100 p-3 rounded-2xl">
          <Users className="text-indigo-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">Manual Attendance</h2>
          <p className="text-sm text-slate-500 font-medium">Add entry/exit for students manually</p>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("entry")}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
            tab === "entry"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Add Entry
        </button>
        <button
          onClick={() => setTab("exit")}
          className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            tab === "exit"
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <LogOut size={16} /> Add Exit
        </button>
      </div>

      {/* Entry Tab */}
      {tab === "entry" && (
        <form onSubmit={handleAddEntry} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase">Current Date</p>
              <p className="text-lg font-black text-indigo-900">{new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase">Current Time</p>
              <p className="text-lg font-black text-indigo-900">{currentTime}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Student ID</label>
            <input
              type="text"
              placeholder="e.g., 2026ST01"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900 placeholder-slate-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Calendar size={16} /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <CheckCircle size={16} /> Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-slate-900"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Entry Time</label>
              <input
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Exit Time (Optional)</label>
              <input
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Entry"}
          </button>
        </form>
      )}

      {/* Exit Tab */}
      {tab === "exit" && (
        <form onSubmit={handleAddExit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase">Current Date</p>
              <p className="text-lg font-black text-green-900">{new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-green-600 uppercase">Current Time</p>
              <p className="text-lg font-black text-green-900">{currentTime}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Student ID</label>
            <input
              type="text"
              placeholder="e.g., 2026ST01"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              autoComplete="off"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-slate-900 placeholder-slate-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Calendar size={16} /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <LogOut size={16} /> Exit Time
            </label>
            <input
              type="time"
              value={exitTime}
              onChange={(e) => setExitTime(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add Exit Time"}
          </button>
        </form>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-700 font-medium">
          Note: At 6 PM daily, exit time is automatically set for students who haven't marked exit. You can also manually add exit time here.
        </p>
      </div>
    </div>
  );
};

export default ManualAttendance;
