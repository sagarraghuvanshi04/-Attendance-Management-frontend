import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, Info, X, LogOut } from "lucide-react";
import api from "../../services/api";
import Loader from "../../components/Loader"; 

const Attendance = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [stats, setStats] = useState({ totalPresent: 0, attendancePercentage: 0, totalDays: 0 });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get("/attendance/my-attendance");
        
        if (res.data.success) {
          setAttendanceLogs(res.data.attendance || []);
          setStats(res.data.stats || {
             totalPresent: 0,
             attendancePercentage: 0, 
             totalDays: 0
          });
        }
      } catch (error) {
        console.error("Error fetching attendance:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) {
    return <Loader message="Loading Attendance..." />;
  }

  // Sort logs: newest first (descending)
  const sortedLogs = [...attendanceLogs].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return (
    <div className="p-2 md:p-4 mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* --- Top Stats Row --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <StatCard 
            title="Attendance Rate" 
            value={`${stats.attendancePercentage || 0}%`} 
            desc="Keep it above 80%" 
            icon={<CheckCircle2 className="text-emerald-500" />} 
        />
        <StatCard 
            title="Total Present" 
            value={`${stats.totalPresent} Days`} 
            desc="Current record" 
            icon={<CalendarIcon className="text-indigo-500" />} 
        />
        <StatCard 
            title="Total Days" 
            value={`${stats.totalDays} Days`} 
            desc="Total logged days" 
            icon={<Clock className="text-orange-500" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* --- Left: Calendar Heatmap --- */}
        <div className="lg:col-span-2 bg-white rounded-2xl md:rounded-[2.5rem] p-3 md:p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <h3 className="text-base md:text-xl font-black text-slate-800 tracking-tight">
                {new Date(currentYear, currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-1 md:gap-2">
                <button 
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(currentYear - 1);
                    } else {
                      setCurrentMonth(currentMonth - 1);
                    }
                  }}
                  className="px-2 md:px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold text-xs md:text-sm transition-all"
                >
                  ←
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                      return;
                    }
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(currentYear + 1);
                    } else {
                      setCurrentMonth(currentMonth + 1);
                    }
                  }}
                  className="px-2 md:px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold text-xs md:text-sm transition-all"
                >
                  →
                </button>
              </div>
            </div>
            <div className="flex gap-1 text-[8px] md:text-xs font-bold flex-wrap">
              <span className="flex items-center gap-1 text-white bg-green-500 px-2 py-0.5 rounded">● Student</span>
              <span className="flex items-center gap-1 text-white bg-purple-500 px-2 py-0.5 rounded">● Staff/Admin</span>
              <span className="flex items-center gap-1 text-white bg-red-500 px-2 py-0.5 rounded">● Absent</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-center text-[8px] md:text-xs font-bold text-slate-500 pb-1 md:pb-2">
                {day}
              </div>
            ))}
            
            {(() => {
              const firstDay = new Date(currentYear, currentMonth, 1).getDay();
              const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
              const today = new Date();
              const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
              const todayDate = today.getDate();
              const days = [];

              for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="h-6 md:h-12 bg-slate-50 rounded"></div>);
              }

              for (let day = 1; day <= daysInMonth; day++) {
                const dateToCheck = new Date(currentYear, currentMonth, day);
                dateToCheck.setHours(0, 0, 0, 0);
                
                const log = attendanceLogs.find(log => {
                  const logDate = new Date(log.date);
                  const calendarDate = new Date(currentYear, currentMonth, day);
                  return logDate.getFullYear() === calendarDate.getFullYear() &&
                         logDate.getMonth() === calendarDate.getMonth() &&
                         logDate.getDate() === calendarDate.getDate();
                });
                
                const isPresent = log?.status === "Present";
                const isAbsent = log?.status === "Absent";
                const isStudentMarked = log?.markedBy === "STUDENT";
                const isStaffAdminMarked = log?.markedBy === "STAFF" || log?.markedBy === "ADMIN";
                const isSystemMarked = log?.markedBy === "SYSTEM";
                const isToday = isCurrentMonth && day === todayDate;

                let bgColor = "bg-slate-50";
                let textColor = "text-slate-700";
                
                if (log) {
                  if (isAbsent) {
                    bgColor = "bg-red-500";
                    textColor = "text-white";
                  } else if (isPresent && isStudentMarked) {
                    bgColor = "bg-green-500";
                    textColor = "text-white";
                  } else if (isPresent && isStaffAdminMarked) {
                    bgColor = "bg-purple-500";
                    textColor = "text-white";
                  } else if (isPresent && isSystemMarked) {
                    bgColor = "bg-green-500";
                    textColor = "text-white";
                  }
                }

                days.push(
                  <button
                    key={day}
                    onClick={() => log && setSelectedLog(log)}
                    className={`h-6 md:h-12 rounded-lg border-2 p-0.5 md:p-2 transition-all text-[7px] md:text-sm font-bold ${
                      isToday ? "border-indigo-600 bg-indigo-50" : "border-slate-100"
                    } ${log ? "cursor-pointer hover:shadow-lg" : "cursor-default"} ${bgColor} ${textColor} flex items-center justify-center`}
                  >
                    {day}
                  </button>
                );
              }
              
              return days;
            })()}
          </div>
        </div>

        {/* --- Right: Recent Activity Logs --- */}
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-3 md:p-6 shadow-sm border border-slate-100">
          <h3 className="text-base md:text-lg font-black text-slate-800 mb-4">Recent Logs</h3>
          <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto space-y-2 md:space-y-4 pr-2">
            {sortedLogs.length > 0 ? sortedLogs.map((log, index) => {
              const isStudentMarked = log.markedBy === 'STUDENT';
              const isStaffAdminMarked = log.markedBy === 'STAFF' || log.markedBy === 'ADMIN';
              const isSystemMarked = log.markedBy === 'SYSTEM';
              
              // For auto absent (SYSTEM marked), show current time or entry time if available
              const displayTime = log.entryTime 
                ? new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : (isSystemMarked ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-");
              
              return (
              <div key={index} className="flex items-center justify-between p-2 md:p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className={`p-1 md:p-2 rounded-lg flex-shrink-0 ${log.status === 'Present' ? (isStudentMarked ? 'bg-green-100 text-green-600' : (isStaffAdminMarked ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600')) : 'bg-red-100 text-red-600'}`}>
                    {log.status === 'Present' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs md:text-sm font-bold text-slate-700 truncate">
                        {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        {displayTime}
                        {log.exitTime ? ` → ${new Date(log.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md flex-shrink-0 ${log.status === 'Present' ? (isStudentMarked ? 'text-green-500' : (isStaffAdminMarked ? 'text-purple-500' : 'text-slate-500')) : 'text-red-500'}`}>
                  {log.status}
                </span>
              </div>
            );
            }) : <p className="text-center text-slate-400 py-6 text-sm">No logs found</p>}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl p-4 md:p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg md:text-xl font-black text-slate-800">Attendance Details</h3>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                <span className="font-bold text-slate-600">Date</span>
                <span className="font-black text-slate-800">
                  {new Date(selectedLog.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl text-sm">
                <span className="font-bold text-green-700">Entry Time</span>
                <span className="font-black text-green-700">
                  {selectedLog.entryTime ? new Date(selectedLog.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (selectedLog.markedBy === 'SYSTEM' ? 'Auto Marked' : '-')}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl text-sm">
                <span className="font-bold text-blue-700 flex items-center gap-2"><LogOut size={14} /> Exit Time</span>
                <span className="font-black text-blue-700">
                  {selectedLog.exitTime ? new Date(selectedLog.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
              {selectedLog.workingHours && (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl text-sm">
                  <span className="font-bold text-orange-700">Working Hours</span>
                  <span className="font-black text-orange-700">{selectedLog.workingHours} hrs</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl text-sm">
                <span className="font-bold text-indigo-700">Status</span>
                <span className={`px-2 py-1 rounded-lg text-xs font-black text-white ${
                  selectedLog.status === 'Present' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {selectedLog.status}
                </span>
              </div>
              {selectedLog.markedBy && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl text-sm">
                  <span className="font-bold text-purple-700">Marked By</span>
                  <span className="px-2 py-1 rounded-lg text-xs font-black bg-purple-500 text-white">
                    {selectedLog.markedBy === 'SYSTEM' ? 'Auto Marked' : selectedLog.markedBy}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, desc, icon }) => (
  <div className="bg-white p-3 md:p-6 rounded-xl md:rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-3 md:gap-5">
    <div className="p-2 md:p-4 bg-slate-50 rounded-lg md:rounded-2xl flex-shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{title}</p>
      <h4 className="text-lg md:text-2xl font-black text-slate-800 truncate">{value}</h4>
      <p className="text-[9px] md:text-[10px] font-medium text-slate-500 mt-0.5 truncate">{desc}</p>
    </div>
  </div>
);

export default Attendance;
