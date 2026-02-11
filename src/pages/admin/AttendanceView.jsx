import React, { useState, useEffect } from "react";
import { Users, UserCircle, Calendar, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const AdminAttendanceView = () => {
  const [activeTab, setActiveTab] = useState("student");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchRecentAttendance();
  }, [activeTab]);

  const fetchRecentAttendance = async () => {
    try {
      const endpoint = activeTab === "student" 
        ? "/attendance/all"
        : "/staff-attendance/all";
      const res = await api.get(endpoint);
      setRecentAttendance(res.data.attendance || []);
    } catch (err) {
      console.error("Failed to fetch recent attendance:", err);
      toast.error("Failed to load attendance");
    }
  };

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPeople();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const searchPeople = async () => {
    try {
      const endpoint = activeTab === "student" 
        ? `/students?search=${searchQuery}`
        : `/staff?search=${searchQuery}`;
      const res = await api.get(endpoint);
      setSearchResults(res.data.students || res.data.staff || []);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Search failed");
    }
  };

  const selectPerson = async (person) => {
    setSelectedPerson(person);
    setSearchQuery("");
    setSearchResults([]);
    setLoading(true);

    try {
      const endpoint = activeTab === "student"
        ? `/attendance/student/${person._id}`
        : `/staff-attendance/staff/${person._id}`;
      const res = await api.get(endpoint);
      setAttendance(res.data.attendance || []);
    } catch (err) {
      console.error('Attendance fetch error:', err);
      toast.error(err.response?.data?.message || "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

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
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 bg-slate-50 rounded-lg"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const att = getAttendanceForDate(currentDate);
      const isToday = currentDate.toDateString() === new Date().toDateString();
      const isPresent = att?.status === "Present";
      
      days.push(
        <button
          key={day}
          onClick={() => att && setSelectedLog(att)}
          className={`h-24 rounded-lg border-2 p-2 transition-all overflow-hidden ${
            isToday ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-white"
          } ${att ? "cursor-pointer hover:shadow-lg" : "cursor-default"}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-bold ${
              isToday ? "text-indigo-600" : "text-slate-600"
            }`}>{day}</span>
            {att && (
              <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                isPresent ? "bg-green-500" : "bg-red-500"
              }`}></div>
            )}
          </div>
          {att && (
            <div className="text-[9px] text-slate-500 space-y-0.5">
              {(att.entryTime || att.checkIn) && (
                <div className="flex items-center gap-0.5 truncate">
                  <span className="text-green-600 flex-shrink-0">↓</span>
                  <span className="truncate">{new Date(att.entryTime || att.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
              {(att.exitTime || att.checkOut) && (
                <div className="flex items-center gap-0.5 truncate">
                  <span className="text-red-600 flex-shrink-0">↑</span>
                  <span className="truncate">{new Date(att.exitTime || att.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Attendance Viewer</h1>
        <p className="text-slate-500 mt-1">View student and staff attendance records</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab("student"); setSelectedPerson(null); setAttendance([]); }}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === "student" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          <Users size={18} className="inline mr-2" />
          Students
        </button>
        <button
          onClick={() => { setActiveTab("staff"); setSelectedPerson(null); setAttendance([]); }}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === "staff" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          <UserCircle size={18} className="inline mr-2" />
          Staff
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-slate-100 z-50 max-h-60 overflow-y-auto">
              {searchResults.map((person) => (
                <button
                  key={person._id}
                  onClick={() => selectPerson(person)}
                  className="w-full p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                >
                  <p className="font-bold text-slate-800">{person.name}</p>
                  <p className="text-xs text-slate-500">
                    {activeTab === "student" ? person.studentId : person.staffId} • {person.email}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Person */}
      {selectedPerson && (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Viewing attendance for</p>
              <h3 className="text-2xl font-black">{selectedPerson.name}</h3>
              <p className="text-sm opacity-90">
                {activeTab === "student" ? selectedPerson.studentId : selectedPerson.staffId}
              </p>
            </div>
            <button
              onClick={() => { setSelectedPerson(null); setAttendance([]); }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Recent Attendance */}
      {!selectedPerson && recentAttendance.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-4">Recent Attendance Records</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentAttendance.slice(0, 10).map((record) => (
              <button
                key={record._id}
                onClick={() => setSelectedLog(record)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    record.status === "Present" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                  }`}>
                    {record.status === "Present" ? "✓" : "✗"}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">
                      {activeTab === "student" 
                        ? record.student?.name || "Unknown"
                        : record.staff?.name || "Unknown"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                      {(record.entryTime || record.checkIn) && (
                        <span className="flex items-center gap-1">
                          <span className="text-green-600">↓</span>
                          {new Date(record.entryTime || record.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {(record.exitTime || record.checkOut) && (
                        <span className="flex items-center gap-1">
                          <span className="text-red-600">↑</span>
                          {new Date(record.exitTime || record.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  record.status === "Present" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {record.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      {selectedPerson && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-black text-slate-800">
              {selectedMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>
          )}
        </div>
      )}

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
                  <span className="text-sm font-bold text-green-700">
                    {activeTab === "student" ? "Entry Time" : "Check In"}
                  </span>
                </div>
                <span className="text-lg font-black text-green-700">
                  {(selectedLog.entryTime || selectedLog.checkIn) 
                    ? new Date(selectedLog.entryTime || selectedLog.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                    : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-xl">↑</span>
                  <span className="text-sm font-bold text-red-700">
                    {activeTab === "student" ? "Exit Time" : "Check Out"}
                  </span>
                </div>
                <span className="text-lg font-black text-red-700">
                  {(selectedLog.exitTime || selectedLog.checkOut) 
                    ? new Date(selectedLog.exitTime || selectedLog.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
                    : '-'}
                </span>
              </div>
              {activeTab === "staff" && selectedLog.workingHours && (
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                  <span className="text-sm font-bold text-purple-700">Working Hours</span>
                  <span className="text-lg font-black text-purple-700">{selectedLog.workingHours}h</span>
                </div>
              )}
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

export default AdminAttendanceView;
