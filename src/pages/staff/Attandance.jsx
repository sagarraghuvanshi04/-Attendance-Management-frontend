import React, { useEffect, useState, useRef } from "react";
import {
  QrCode, Search, UserCheck, UserMinus, Calendar, Clock, Download, CheckCircle, LogIn, LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

const Attendance = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [staffInfo, setStaffInfo] = useState(null);
  const qrRef = useRef(null);

  // ---------------- FETCH ATTENDANCE FROM BACKEND ----------------
  useEffect(() => {
    fetchAttendance();
    fetchMyAttendance();
    fetchStaffInfo();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await api.get("/staff/attendance");
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (error) {
      console.error("Attendance fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      const res = await api.get("/staff-attendance/my");
      if (res.data.success) {
        setMyAttendance(res.data.attendance);
        const today = res.data.attendance.find(a => 
          new Date(a.date).toDateString() === new Date().toDateString()
        );
        setTodayAttendance(today);
      }
    } catch (err) {
      console.error("My attendance error:", err);
    }
  };

  const fetchStaffInfo = async () => {
    try {
      const res = await api.get("/staff/profile");
      if (res.data.success) {
        setStaffInfo(res.data.staff);
      }
    } catch (err) {
      console.error("Staff info error:", err);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setMarking(true);
      const res = await api.post("/staff-attendance/mark");
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMyAttendance();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setMarking(false);
    }
  };

  const handleDownloadQR = () => {
    if (!staffInfo) {
      toast.error("Staff info not loaded");
      return;
    }

    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 400;
    canvas.height = 480;

    img.onload = () => {
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(img, 50, 50, 300, 300);

      // Add text
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(staffInfo.name, 200, 380);

      ctx.font = '18px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(staffInfo.staffId, 200, 410);
      ctx.fillText(staffInfo.role || 'Staff', 200, 440);

      // Download
      const link = document.createElement('a');
      link.download = `${staffInfo.staffId}_QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('QR Code downloaded!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ---------------- FILTER + SEARCH LOGIC ----------------
  const filteredLogs = logs.filter((log) => {
    const matchesType = filter === "all" || log.type === filter;

    const matchesSearch =
      log.studentId?.name
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      log.seat?.toLowerCase().includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ---------- MY ATTENDANCE CARD ---------- */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[3rem] text-white">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 className="text-2xl font-black mb-2">My Attendance Today</h3>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Check In</p>
                <p className="text-2xl font-black mt-1">
                  {todayAttendance?.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Check Out</p>
                <p className="text-2xl font-black mt-1">
                  {todayAttendance?.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
              <div>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Working Hours</p>
                <p className="text-2xl font-black mt-1">
                  {todayAttendance?.workingHours ? `${todayAttendance.workingHours} hrs` : '--'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleMarkAttendance}
            disabled={marking || todayAttendance?.checkOut}
            className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {marking ? (
              "Marking..."
            ) : todayAttendance?.checkOut ? (
              <><CheckCircle size={20} /> Checked Out</>
            ) : todayAttendance?.checkIn ? (
              <><LogOut size={20} /> Check Out</>
            ) : (
              <><LogIn size={20} /> Check In</>
            )}
          </button>
        </div>
      </div>

      {/* ---------- TOP BAR ---------- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Attendance Logs
          </h2>
          <p className="text-slate-500 font-medium">
            Manage and track daily library footfall.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={() => navigate("/staff/scanner")}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3
            bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem]
            font-black hover:bg-indigo-700 transition-all active:scale-95"
          >
            <QrCode size={20} /> Open Scanner
          </button>

          <button 
            onClick={handleDownloadQR}
            className="p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:bg-slate-50 transition-all"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* ---------- FILTER TABS ---------- */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {["all", "Entry", "Exit"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black capitalize transition-all
              ${
                filter === t
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }
            `}
          >
            {t === "all" ? "All Activity" : `${t} Only`}
          </button>
        ))}
      </div>

      {/* ---------- TABLE ---------- */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or seat..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl
              text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-bold text-sm bg-slate-50 px-5 py-3 rounded-2xl">
            <Calendar size={16} />
            {new Date().toDateString()}
          </div>
        </div>

        {/* ---------- DATA ---------- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-xs font-black text-slate-400">
                  Student
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400">
                  Type
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400">
                  Time
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400">
                  Seat
                </th>
                <th className="px-8 py-5 text-xs font-black text-slate-400">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 font-bold">
                    Loading attendance...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-all">
                    <td className="px-8 py-6 font-black text-slate-800">
                      {log.studentId?.name || "Unknown"}
                    </td>

                    <td
                      className={`px-8 py-6 font-bold flex items-center gap-2 ${
                        log.type === "Entry"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {log.type === "Entry" ? (
                        <UserCheck size={16} />
                      ) : (
                        <UserMinus size={16} />
                      )}
                      {log.type}
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-black text-slate-600 bg-slate-100 w-fit px-3 py-1 rounded-lg">
                        <Clock size={14} className="text-slate-400" />
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-8 py-6 font-black text-slate-500">
                      {log.seat || "-"}
                    </td>

                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600">
                        {log.status || "Verified"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden QR Code for download */}
      <div ref={qrRef} className="hidden">
        {staffInfo && (
          <QRCodeSVG 
            value={staffInfo.staffId}
            size={300}
            level="H"
            includeMargin={true}
          />
        )}
      </div>
    </div>
  );
};

export default Attendance;
