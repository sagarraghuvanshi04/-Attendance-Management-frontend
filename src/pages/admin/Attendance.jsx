import React, { useState, useEffect } from "react";
import { Users, Calendar, CheckCircle2, XCircle, X, Search, Filter, AlertCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import ManualAttendance from "../../components/ManualAttendance";
import Loader from "../../components/Loader";

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('filter'); // 'arrivals' or 'departures'
  
  const [presentStudents, setPresentStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [seatFilter, setSeatFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchTodayPresentStudents();
  }, [filterType]); // Re-fetch when filter changes

  const fetchTodayPresentStudents = async () => {
    try {
      let endpoint = "/attendance/today-all";
      
      // Apply filter based on URL parameter
      if (filterType === 'arrivals') {
        endpoint = "/attendance/today-arrivals";
      } else if (filterType === 'departures') {
        endpoint = "/attendance/today-departures";
      } else if (filterType === 'live') {
        endpoint = "/attendance/live-students";
      }
      
      const { data } = await api.get(endpoint);
      if (data.success) {
        setPresentStudents(data.students || data.liveStudents || []);
        setFilteredStudents(data.students || data.liveStudents || []);
      }
    } catch (error) {
      console.error("Error fetching present students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = presentStudents;

    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (seatFilter !== "All") {
      filtered = filtered.filter(s => s.seat?.startsWith(seatFilter));
    }

    setFilteredStudents(filtered);
  }, [searchQuery, seatFilter, presentStudents]);

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setModalLoading(true);
    fetchStudentAttendance(student._id, currentMonth, currentYear);
  };

  const fetchStudentAttendance = async (studentId, month, year) => {
    try {
      const { data } = await api.get(`/attendance/student-monthly/${studentId}?month=${month}&year=${year}`);
      if (data.success) {
        setStudentAttendance(data.attendance);
        setAttendanceStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching student attendance:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleMonthChange = (direction) => {
    let newMonth = currentMonth;
    let newYear = currentYear;

    if (direction === "prev") {
      if (currentMonth === 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      } else {
        newMonth = currentMonth - 1;
      }
    } else {
      const today = new Date();
      if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
        return;
      }
      if (currentMonth === 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      } else {
        newMonth = currentMonth + 1;
      }
    }

    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setModalLoading(true);
    fetchStudentAttendance(selectedStudent._id, newMonth, newYear);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setStudentAttendance([]);
    setAttendanceStats({});
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
    setSelectedDate(null);
  };

  const uniqueSeats = [...new Set(presentStudents.map(s => s.seat?.charAt(0)).filter(Boolean))];

  if (loading) {
    return <Loader message="Loading Attendance..." />;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Manual Attendance Section */}
      <ManualAttendance onAttendanceAdded={fetchTodayPresentStudents} />

      {/* Today's Attendance Section */}
      <div className="p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">
            {filterType === 'arrivals' ? "Today's Arrivals" : 
             filterType === 'departures' ? "Today's Departures" : 
             filterType === 'live' ? "Live Students (Currently Present)" :
             "Today's Attendance"}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {filterType === 'arrivals' ? "Students who entered today" : 
             filterType === 'departures' ? "Students who left today" : 
             filterType === 'live' ? "Students currently in the library (real-time)" :
             "All students with their attendance status"} - Click to view monthly calendar
          </p>
        </div>
        <div className="bg-indigo-100 px-6 py-3 rounded-2xl">
          <p className="text-sm font-bold text-indigo-600">Total Students</p>
          <p className="text-3xl font-black text-indigo-700">{filteredStudents.length} / {presentStudents.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-500" />
          <select
            value={seatFilter}
            onChange={(e) => setSeatFilter(e.target.value)}
            className="px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none font-bold bg-white"
          >
            <option value="All">All Seats</option>
            {uniqueSeats.sort().map(seat => (
              <option key={seat} value={seat}>{seat} Seats</option>
            ))}
          </select>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center">
          <Users className="mx-auto text-slate-300 mb-4" size={64} />
          <p className="text-slate-500 font-bold">{presentStudents.length === 0 ? "No students present today" : "No students match your filters"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student._id}
              onClick={() => handleStudentClick(student)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{student.name}</h3>
                  <p className="text-sm font-bold text-slate-400">{student.studentId}</p>
                </div>
                <div className={`p-2 rounded-lg ${
                  student.status === "Present" ? "bg-green-100" :
                  student.status === "Absent" ? "bg-red-100" :
                  "bg-slate-100"
                }`}>
                  {student.status === "Present" ? <CheckCircle2 className="text-green-600" size={20} /> :
                   student.status === "Absent" ? <XCircle className="text-red-600" size={20} /> :
                   <AlertCircle className="text-slate-600" size={20} />}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Seat: <span className="font-bold text-slate-700">{student.seat || "N/A"}</span></span>
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                  student.status === "Present" ? "text-green-600 bg-green-50" :
                  student.status === "Absent" ? "text-red-600 bg-red-50" :
                  "text-slate-600 bg-slate-50"
                }`}>
                  {student.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student Calendar Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{selectedStudent.name}</h2>
                <p className="text-slate-500 font-medium">{selectedStudent.studentId} • Seat: {selectedStudent.seat || "N/A"}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            {modalLoading ? (
              <div className="p-12">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-2xl text-center">
                    <p className="text-sm font-bold text-green-600">Present</p>
                    <p className="text-3xl font-black text-green-700">{attendanceStats.totalPresent || 0}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-2xl text-center">
                    <p className="text-sm font-bold text-red-600">Absent</p>
                    <p className="text-3xl font-black text-red-700">{attendanceStats.totalAbsent || 0}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl text-center">
                    <p className="text-sm font-bold text-indigo-600">Total Days</p>
                    <p className="text-3xl font-black text-indigo-700">{attendanceStats.totalDays || 0}</p>
                  </div>
                </div>

                {/* Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleMonthChange("prev")}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <span className="text-xl font-bold text-slate-600">←</span>
                      </button>
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Calendar size={20} />
                        {new Date(currentYear, currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button 
                        onClick={() => handleMonthChange("next")}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <span className="text-xl font-bold text-slate-600">→</span>
                      </button>
                    </div>
                    <div className="flex gap-2 text-xs font-bold">
                      <span className="flex items-center gap-1 text-white bg-green-500 px-3 py-1 rounded-lg">● Present</span>
                      <span className="flex items-center gap-1 text-white bg-red-500 px-3 py-1 rounded-lg">● Absent</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-3">
                    {(() => {
                      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                      const today = new Date();
                      const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
                      const todayDate = today.getDate();

                      return [...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        
                        const isPresent = studentAttendance.some(log => {
                          const logDate = new Date(log.date);
                          return logDate.getDate() === day && 
                                 logDate.getMonth() === currentMonth && 
                                 logDate.getFullYear() === currentYear && 
                                 log.status === "Present";
                        });
                        
                        const isAbsent = studentAttendance.some(log => {
                          const logDate = new Date(log.date);
                          return logDate.getDate() === day && 
                                 logDate.getMonth() === currentMonth && 
                                 logDate.getFullYear() === currentYear && 
                                 log.status === "Absent";
                        });

                        const isToday = isCurrentMonth && day === todayDate;

                        return (
                          <div 
                            key={i}
                            onClick={() => {
                              const logData = studentAttendance.find(log => {
                                const logDate = new Date(log.date);
                                return logDate.getDate() === day && 
                                       logDate.getMonth() === currentMonth && 
                                       logDate.getFullYear() === currentYear;
                              });
                              if (logData) setSelectedDate(logData);
                            }}
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
                      });
                    })()}
                  </div>
                </div>

                {/* Recent Logs */}
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-4">Recent Logs</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {studentAttendance.length > 0 ? studentAttendance.slice(0, 10).map((log, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${log.status === 'Present' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {log.status === 'Present' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs font-medium text-slate-400">
                              {log.entryTime ? new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${log.status === 'Present' ? 'text-green-500' : 'text-red-500'}`}>
                          {log.status}
                        </span>
                      </div>
                    )) : <p className="text-center text-slate-400 py-6">No attendance records</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Date Detail Popup */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setSelectedDate(null)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-800">Attendance Details</h3>
              <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date</p>
                <p className="text-lg font-black text-slate-800">
                  {new Date(selectedDate.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className={`p-4 rounded-2xl ${
                selectedDate.status === 'Present' ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className="text-xs font-bold uppercase mb-1" style={{
                  color: selectedDate.status === 'Present' ? '#16a34a' : '#dc2626'
                }}>
                  Status
                </p>
                <p className="text-lg font-black" style={{
                  color: selectedDate.status === 'Present' ? '#16a34a' : '#dc2626'
                }}>
                  {selectedDate.status}
                </p>
              </div>

              {selectedDate.entryTime && (
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Entry Time</p>
                  <p className="text-lg font-black text-blue-700">
                    {new Date(selectedDate.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}

              {selectedDate.exitTime && (
                <div className="bg-purple-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-1">Exit Time</p>
                  <p className="text-lg font-black text-purple-700">
                    {new Date(selectedDate.exitTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}

              {selectedDate.workingHours > 0 && (
                <div className="bg-amber-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-amber-600 uppercase mb-1">Working Hours</p>
                  <p className="text-lg font-black text-amber-700">{selectedDate.workingHours} hrs</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Attendance;
