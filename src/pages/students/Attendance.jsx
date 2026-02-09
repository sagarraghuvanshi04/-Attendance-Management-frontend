import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, Info, Loader2, X } from "lucide-react";
import api from "../../services/api"; 

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
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* --- Top Stats Row --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Left: Calendar Heatmap --- */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {new Date(currentYear, currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-3">
              {/* Month/Year Filter */}
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(currentYear - 1);
                    } else {
                      setCurrentMonth(currentMonth - 1);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold text-sm transition-all"
                >
                  ←
                </button>
                <button 
                  onClick={() => {
                    const today = new Date();
                    if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
                      return; // Don't go to future
                    }
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(currentYear + 1);
                    } else {
                      setCurrentMonth(currentMonth + 1);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold text-sm transition-all"
                >
                  →
                </button>
              </div>
              <div className="flex gap-2 text-xs font-bold">
                <span className="flex items-center gap-1 text-white bg-green-500 px-3 py-1 rounded-lg">● Present</span>
                <span className="flex items-center gap-1 text-white bg-red-500 px-3 py-1 rounded-lg">● Absent</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-500 pb-2">
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

              // Empty cells before first day
              for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="h-16 md:h-20 bg-slate-50 rounded-lg"></div>);
              }

              // Days of month
              for (let day = 1; day <= daysInMonth; day++) {
                const dateToCheck = new Date(currentYear, currentMonth, day);
                
                const log = attendanceLogs.find(log => {
                  const logDate = new Date(log.date);
                  return logDate.getDate() === day && 
                         logDate.getMonth() === currentMonth && 
                         logDate.getFullYear() === currentYear;
                });
                
                const isPresent = log?.status === "Present";
                const isAbsent = log?.status === "Absent";
                const isToday = isCurrentMonth && day === todayDate;

                days.push(
                  <button
                    key={day}
                    onClick={() => log && setSelectedLog(log)}
                    className={`h-16 md:h-20 rounded-lg border-2 p-2 transition-all ${
                      isToday ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white"
                    } ${log ? "cursor-pointer hover:shadow-lg" : "cursor-default"}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-sm font-bold ${
                        isToday ? "text-indigo-600" : "text-slate-600"
                      }`}>{day}</span>
                      {log && (
                        <div className={`h-2 w-2 rounded-full ${
                          isPresent ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                      )}
                    </div>
                  </button>
                );
              }
              
              return days;
            })()}
          </div>
        </div>

        {/* --- Right: Recent Activity Logs --- */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6">Recent Logs</h3>
          <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {attendanceLogs.length > 0 ? attendanceLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${log.status === 'Present' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {log.status === 'Present' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                        {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {log.entryTime ? new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${log.status === 'Present' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {log.status}
                </span>
              </div>
            )) : <p className="text-center text-slate-400 py-10">No logs found</p>}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800">Attendance Details</h3>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <span className="text-sm font-bold text-slate-600">Date</span>
                <span className="text-sm font-black text-slate-800">
                  {new Date(selectedLog.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">↓</span>
                  <span className="text-sm font-bold text-green-700">Entry Time</span>
                </div>
                <span className="text-lg font-black text-green-700">
                  {selectedLog.entryTime ? new Date(selectedLog.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-xl">↑</span>
                  <span className="text-sm font-bold text-red-700">Exit Time</span>
                </div>
                <span className="text-lg font-black text-red-700">
                  {selectedLog.exitTime ? new Date(selectedLog.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl">
                <span className="text-sm font-bold text-indigo-700">Status</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-black ${
                  selectedLog.status === 'Present' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedLog.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component
const StatCard = ({ title, value, desc, icon }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
    <div className="p-4 bg-slate-50 rounded-2xl">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <h4 className="text-2xl font-black text-slate-800">{value}</h4>
      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

export default Attendance;