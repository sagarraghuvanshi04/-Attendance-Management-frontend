import React, { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle, XCircle, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const MyAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [view, setView] = useState("table"); // "table" or "calendar"

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get("/staff-attendance/my");
      setAttendance(res.data.attendance || []);
      
      const today = res.data.attendance?.find(a => {
        const attDate = new Date(a.date).toDateString();
        const todayDate = new Date().toDateString();
        return attDate === todayDate;
      });
      setTodayAttendance(today);
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async () => {
    try {
      setMarking(true);
      const res = await api.post("/staff-attendance/mark");
      toast.success(res.data.message);
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setMarking(false);
    }
  };

  const stats = {
    present: attendance.filter(a => a.status === "Present").length,
    totalDays: attendance.length,
    avgHours: attendance.length > 0 
      ? (attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0) / attendance.length).toFixed(1)
      : 0
  };

  // Calculate monthly stats
  const getMonthlyStats = () => {
    const { year, month } = getDaysInMonth(selectedMonth);
    const monthlyAttendance = attendance.filter(a => {
      const attDate = new Date(a.date);
      return attDate.getMonth() === month && attDate.getFullYear() === year;
    });
    
    return {
      totalPresent: monthlyAttendance.filter(a => a.status === "Present").length,
      totalAbsent: monthlyAttendance.filter(a => a.status === "Absent").length,
      totalDays: monthlyAttendance.length
    };
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getAttendanceForDate = (date) => {
    return attendance.find(a => {
      const attDate = new Date(a.date);
      return attDate.getDate() === date.getDate() &&
             attDate.getMonth() === date.getMonth() &&
             attDate.getFullYear() === date.getFullYear();
    });
  };

  const changeMonth = (direction) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      const newMonth = prev.getMonth() + direction;
      const newYear = prev.getFullYear();
      
      // Don't allow going to future months
      if (direction === 1) {
        const targetDate = new Date(newYear, newMonth, 1);
        const todayDate = new Date(currentYear, currentMonth, 1);
        if (targetDate > todayDate) {
          return prev; // Don't change if trying to go to future
        }
      }
      
      newDate.setMonth(newMonth);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 bg-slate-50 rounded-xl"></div>);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const att = getAttendanceForDate(currentDate);
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const isPresent = att?.status === "Present";
      const isAbsent = att?.status === "Absent";
      
      days.push(
        <div
          key={day}
          className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer
            ${isPresent ? "bg-green-500 text-white shadow-md hover:shadow-lg" : 
              isAbsent ? "bg-red-500 text-white shadow-md hover:shadow-lg" : 
              "bg-slate-100 text-slate-600"}
            ${isToday && isPresent ? "ring-4 ring-green-400 scale-110" : ""}
            ${isToday && isAbsent ? "ring-4 ring-red-400 scale-110" : ""}`}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800">My Attendance</h1>
        <p className="text-slate-500 mt-1">Track your check-in and check-out times</p>
      </div>

      {/* Mark Attendance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black mb-2">
              {todayAttendance?.checkOut ? "Already Checked Out" : todayAttendance?.checkIn ? "Ready to Check Out?" : "Mark Your Attendance"}
            </h3>
            <p className="text-indigo-100">
              {todayAttendance?.checkIn 
                ? `Checked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : "Click the button to check in"}
            </p>
          </div>
          <button
            onClick={markAttendance}
            disabled={marking || todayAttendance?.checkOut}
            className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {marking ? "Marking..." : todayAttendance?.checkOut ? "Checked Out" : todayAttendance?.checkIn ? "Check Out" : "Check In"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Present Days</p>
              <p className="text-2xl font-black text-slate-800">{stats.present}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Total Days</p>
              <p className="text-2xl font-black text-slate-800">{stats.totalDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Avg Hours</p>
              <p className="text-2xl font-black text-slate-800">{stats.avgHours}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800">Attendance History</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setView("table")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === "table" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                view === "calendar" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : attendance.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-bold">No attendance records yet</p>
          </div>
        ) : view === "calendar" ? (
          <div className="p-6">
            {/* Monthly Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-2xl text-center">
                <p className="text-sm font-bold text-green-600">Present</p>
                <p className="text-3xl font-black text-green-700">{getMonthlyStats().totalPresent}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl text-center">
                <p className="text-sm font-bold text-red-600">Absent</p>
                <p className="text-3xl font-black text-red-700">{getMonthlyStats().totalAbsent}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl text-center">
                <p className="text-sm font-bold text-indigo-600">Total Days</p>
                <p className="text-3xl font-black text-indigo-700">{getMonthlyStats().totalDays}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Calendar size={20} />
                {selectedMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            
            <div className="flex gap-2 text-xs font-bold mb-4 justify-end">
              <span className="flex items-center gap-1 text-white bg-green-500 px-3 py-1 rounded-lg">● Present</span>
              <span className="flex items-center gap-1 text-white bg-red-500 px-3 py-1 rounded-lg">● Absent</span>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {renderCalendar()}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase font-bold text-slate-500">
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Check In</th>
                  <th className="px-6 py-4 text-left">Check Out</th>
                  <th className="px-6 py-4 text-left">Working Hours</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">
                        {record.checkOut && record.workingHours ? `${record.workingHours} hrs` : '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        record.status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAttendance;
