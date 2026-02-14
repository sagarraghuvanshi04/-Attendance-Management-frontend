import React, { useState, useEffect } from "react";
import { Users, Calendar, CheckCircle2, XCircle, X, Search, Filter, AlertCircle, Users2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import ManualAttendance from "../../components/ManualAttendance";
import Loader from "../../components/Loader";

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('filter');
  
  const [presentStudents, setPresentStudents] = useState([]);
  const [presentStaff, setPresentStaff] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [modalLoading, setModalLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [seatFilter, setSeatFilter] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    fetchTodayAttendance();
  }, [filterType]);

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      let endpoint = "/attendance/today-all";
      
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

      // Fetch staff attendance
      try {
        const staffRes = await api.get("/staff-attendance/today-all");
        console.log("Staff attendance response:", staffRes.data);
        if (staffRes.data.success) {
          const formattedStaff = staffRes.data.attendance.map(item => {
            // Handle both populated and non-populated staff data
            const staffData = item.staff || item;
            return {
              _id: staffData._id,
              staffId: staffData.staffId,
              name: staffData.name,
              status: item.status || "Absent",
              checkIn: item.checkIn,
              checkOut: item.checkOut,
              workingHours: item.workingHours || 0,
              date: item.date
            };
          });
          setPresentStaff(formattedStaff);
          setFilteredStaff(formattedStaff);
        }
      } catch (staffErr) {
        console.error("Staff attendance error:", staffErr);
        setPresentStaff([]);
        setFilteredStaff([]);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = activeTab === "students" ? presentStudents : presentStaff;

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.studentId || item.staffId || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === "students" && seatFilter !== "All") {
      filtered = filtered.filter(s => s.seat?.startsWith(seatFilter));
    }

    if (activeTab === "students") {
      setFilteredStudents(filtered);
    } else {
      setFilteredStaff(filtered);
    }
  }, [searchQuery, seatFilter, presentStudents, presentStaff, activeTab]);

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setModalLoading(true);
    fetchStudentAttendance(student._id, currentMonth, currentYear);
  };

  const handleStaffClick = async (staff) => {
    setSelectedStaff(staff);
    setModalLoading(true);
    fetchStaffAttendance(staff._id, currentMonth, currentYear);
  };

  const fetchStudentAttendance = async (studentId, month, year) => {
    try {
      const { data } = await api.get(`/attendance/student/${studentId}?month=${month}&year=${year}`);
      if (data.success) {
        setStudentAttendance(data.attendance);
        setAttendanceStats({
          totalPresent: data.attendance.filter(a => a.status === "Present").length,
          totalAbsent: data.attendance.filter(a => a.status === "Absent").length,
          totalDays: data.attendance.length,
        });
      }
    } catch (error) {
      console.error("Error fetching student attendance:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchStaffAttendance = async (staffId, month, year) => {
    try {
      const { data } = await api.get(`/staff-attendance/staff/${staffId}?month=${month}&year=${year}`);
      if (data.success) {
        setStaffAttendance(data.attendance);
        setAttendanceStats({
          totalPresent: data.attendance.filter(a => a.status === "Present").length,
          totalAbsent: data.attendance.filter(a => a.status === "Absent").length,
          totalDays: data.attendance.length,
        });
      }
    } catch (error) {
      console.error("Error fetching staff attendance:", error);
    } finally {
      setModalLoading(false);
    }
  };

  // Calculate monthly stats
  const getMonthlyStats = () => {
    const attendanceData = activeTab === "students" ? studentAttendance : staffAttendance;
    const monthlyAttendance = attendanceData.filter(a => {
      const attDate = new Date(a.date);
      return attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear;
    });
    
    return {
      totalPresent: monthlyAttendance.filter(a => a.status === "Present").length,
      totalAbsent: monthlyAttendance.filter(a => a.status === "Absent").length,
      totalDays: monthlyAttendance.length
    };
  };

  const handleMonthChange = (direction) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
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
      // Don't allow going to future months
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
    
    if (selectedStudent) {
      fetchStudentAttendance(selectedStudent._id, newMonth, newYear);
    } else if (selectedStaff) {
      fetchStaffAttendance(selectedStaff._id, newMonth, newYear);
    }
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setSelectedStaff(null);
    setStudentAttendance([]);
    setStaffAttendance([]);
    setAttendanceStats({});
    setCurrentMonth(new Date().getMonth());
    setCurrentYear(new Date().getFullYear());
    setSelectedDate(null);
  };

  const uniqueSeats = [...new Set(presentStudents.map(s => s.seat?.charAt(0)).filter(Boolean))];
  const displayData = activeTab === "students" ? filteredStudents : filteredStaff;
  const totalData = activeTab === "students" ? presentStudents : presentStaff;

  if (loading) {
    return <Loader message="Loading Attendance..." />;
  }

  return (
    <div className="p-2 md:p-4 space-y-4 md:space-y-6">
      {/* Manual Attendance Section */}
      <ManualAttendance onAttendanceAdded={fetchTodayAttendance} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-4 md:mb-6">
        <button
          onClick={() => setActiveTab("students")}
          className={`px-3 md:px-4 py-2 md:py-3 font-bold transition-all flex items-center gap-1 md:gap-2 text-sm md:text-base ${
            activeTab === "students"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users size={16} className="md:w-[18px] md:h-[18px]" />
          Students
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-3 md:px-4 py-2 md:py-3 font-bold transition-all flex items-center gap-1 md:gap-2 text-sm md:text-base ${
            activeTab === "staff"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Users2 size={16} className="md:w-[18px] md:h-[18px]" />
          Staff
        </button>
      </div>

      {/* Header */}
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
          <p className="text-sm font-bold text-indigo-600">Total {activeTab === "students" ? "Students" : "Staff"}</p>
          <p className="text-3xl font-black text-indigo-700">{displayData.length} / {totalData.length}</p>
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

      {filteredStudents.length === 0 && activeTab === "students" ? (
        <div className="bg-white rounded-3xl p-12 text-center">
          <Users className="mx-auto text-slate-300 mb-4" size={64} />
          <p className="text-slate-500 font-bold">{presentStudents.length === 0 ? "No students present today" : "No students match your filters"}</p>
        </div>
      ) : filteredStaff.length === 0 && activeTab === "staff" ? (
        <div className="bg-white rounded-3xl p-12 text-center">
          <Users2 className="mx-auto text-slate-300 mb-4" size={64} />
          <p className="text-slate-500 font-bold">{presentStaff.length === 0 ? "No staff present today" : "No staff match your filters"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayData.map((item) => (
            <div
              key={item._id}
              onClick={() => activeTab === "students" ? handleStudentClick(item) : handleStaffClick(item)}
              className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className={`font-black text-slate-800 text-lg ${
                    activeTab === "students" ? "group-hover:text-indigo-600 transition-colors" : ""
                  }`}>
                    {item.name}
                  </h3>
                  <p className="text-sm font-bold text-slate-400">
                    {activeTab === "students" ? item.studentId : item.staffId}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  item.status === "Present" ? "bg-green-100" :
                  item.status === "Absent" ? "bg-red-100" :
                  "bg-slate-100"
                }`}>
                  {item.status === "Present" ? <CheckCircle2 className="text-green-600" size={20} /> :
                   item.status === "Absent" ? <XCircle className="text-red-600" size={20} /> :
                   <AlertCircle className="text-slate-600" size={20} />}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                {activeTab === "students" && (
                  <span className="text-slate-500 font-medium">Seat: <span className="font-bold text-slate-700">{item.seat || "N/A"}</span></span>
                )}
                {activeTab === "staff" && item.checkIn && (
                  <span className="text-slate-500 font-medium">Check In: <span className="font-bold text-slate-700">{new Date(item.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></span>
                )}
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                  item.status === "Present" ? "text-green-600 bg-green-50" :
                  item.status === "Absent" ? "text-red-600 bg-red-50" :
                  "text-slate-600 bg-slate-50"
                }`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Modal - For both Students and Staff */}
      {selectedStudent && activeTab === "students" && (
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
                      const attendanceData = activeTab === "students" ? studentAttendance : staffAttendance;

                      return [...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        
                        const isPresent = attendanceData.some(log => {
                          const logDate = new Date(log.date);
                          return logDate.getDate() === day && 
                                 logDate.getMonth() === currentMonth && 
                                 logDate.getFullYear() === currentYear && 
                                 log.status === "Present";
                        });
                        
                        const isAbsent = attendanceData.some(log => {
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
                              const logData = attendanceData.find(log => {
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Calendar Modal */}
      {selectedStaff && activeTab === "staff" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-2xl font-black text-slate-800">{selectedStaff.name}</h2>
                <p className="text-slate-500 font-medium">{selectedStaff.staffId}</p>
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
                        
                        const isPresent = staffAttendance.some(log => {
                          const logDate = new Date(log.date);
                          return logDate.getDate() === day && 
                                 logDate.getMonth() === currentMonth && 
                                 logDate.getFullYear() === currentYear && 
                                 log.status === "Present";
                        });
                        
                        const isAbsent = staffAttendance.some(log => {
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
                              const logData = staffAttendance.find(log => {
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
  );
};

export default Attendance;
