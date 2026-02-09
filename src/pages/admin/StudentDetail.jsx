// src/pages/admin/StudentDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, Mail, MapPin, Calendar as CalendarIcon, 
  Clock, CreditCard, CheckCircle, User, Save, X, Download, FileText, XCircle
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [payments, setPayments] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewData, setRenewData] = useState({
    durationMonths: "1",
    seatType: "Non-AC",
    paymentMethod: "Cash"
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        setStudentData(res.data.student);
        
        const payRes = await api.get(`/payments/student/${id}`);
        setPayments(payRes.data.payments || []);
      } catch (err) {
        console.error("Error fetching student:", err);
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "attendance" && studentData) {
      fetchAttendance();
    }
  }, [activeTab, currentMonth, currentYear, studentData]);

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get(`/attendance/student-monthly/${studentData._id}?month=${currentMonth}&year=${currentYear}`);
      if (data.success) {
        setAttendance(data.attendance);
        setAttendanceStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
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
  };

  // ---------------- HANDLERS ----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put(`/students/update/${id}`, studentData);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewMembership = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/students/renew/${id}`, renewData);
      if (res.data.success) {
        toast.success(res.data.message);
        setStudentData(res.data.student);
        setShowRenewModal(false);
        // Refresh payments
        const payRes = await api.get(`/payments/student/${id}`);
        setPayments(payRes.data.payments || []);
      }
    } catch (err) {
      console.error("Renew error:", err);
      toast.error(err.response?.data?.message || "Failed to renew membership");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DOWNLOAD LOGIC ----------------
  const downloadCSV = (data, filename) => {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAttendance = () => {
    const data = attendance.map(a => ({
      Date: new Date(a.date).toLocaleDateString(),
      EntryTime: a.entryTime || 'N/A',
      ExitTime: a.exitTime || 'N/A',
      WorkingHours: a.workingHours || 'N/A',
      Status: a.status
    }));
    downloadCSV(data, `${studentData.name}_Attendance_Report`);
  };

  const handleDownloadPayments = () => {
    const data = payments.map(p => ({
      Date: new Date(p.createdAt).toLocaleDateString(),
      Description: p.description || 'Monthly Fees',
      Amount: p.amount,
      Method: p.paymentMethod,
      Status: 'Paid'
    }));
    downloadCSV(data, `${studentData.name}_Payment_History`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!studentData) {
    return <div className="flex items-center justify-center min-h-screen text-rose-600 font-bold text-xl">Student not found</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-all">
          <ArrowLeft size={20} /> Back to Directory
        </button>
        <div className="flex gap-3 w-full md:w-auto">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200">
                <X size={18} /> Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <><Save size={18} /> Save</>
                )}
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700">
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-50 flex flex-col md:flex-row gap-8 items-center">
        <div className="h-32 w-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-xl shadow-indigo-100">
          {studentData.name.charAt(0)}
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {isEditing ? (
              <input name="name" value={studentData.name} onChange={handleInputChange} className="text-3xl font-black text-slate-800 border-b-2 border-indigo-600 outline-none bg-indigo-50/50 px-2" />
            ) : (
              <h2 className="text-4xl font-black text-slate-800">{studentData.name}</h2>
            )}
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${studentData.status === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
              {studentData.status}
            </span>
          </div>
          <div className="text-slate-400 font-bold flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5"><User size={16} className="text-indigo-400"/> ID: {studentData.studentId}</span>
            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-indigo-400"/> {studentData.address || 'No address provided'}</span>
          </div>
        </div>
        <button 
          onClick={() => setStudentData(prev => ({...prev, status: prev.status === "Active" ? "Inactive" : "Active"}))}
          className={`px-6 py-3 rounded-2xl font-bold transition-all ${studentData.status === "Active" ? "bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white"}`}
        >
          {studentData.status === "Active" ? "Disable Access" : "Enable Access"}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
        {["overview", "attendance", "payments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-8 text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
              activeTab === tab ? "border-b-4 border-indigo-600 text-indigo-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === "overview" && (
          <>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <DetailCard isEditing={isEditing} name="phone" onChange={handleInputChange} icon={<Phone/>} label="Phone" value={studentData.phone || 'N/A'} color="text-indigo-500" />
              <DetailCard isEditing={isEditing} name="email" onChange={handleInputChange} icon={<Mail/>} label="Email" value={studentData.email} color="text-purple-500" />
              <DetailCard isEditing={isEditing} name="shift" onChange={handleInputChange} isSelect options={["Morning", "Evening", "Full Day"]} icon={<Clock/>} label="Shift" value={studentData.shift} color="text-amber-500" />
              <DetailCard isEditing={false} icon={<CreditCard/>} label="Aadhar (Last 4)" value={`**** ${studentData.aadharLast4}`} color="text-emerald-500" />
            </div>
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden h-fit">
              <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">Membership Plan</h4>
              <div className="space-y-6 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Seat Number</p>
                    <p className="text-2xl font-black text-indigo-400">{studentData.seat || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Shift</p>
                    <p className="text-sm font-black text-purple-400">{studentData.shift || 'N/A'}</p>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Expiry Date</p>
                  <p className="text-xl font-black text-rose-400">{studentData.expiry ? new Date(studentData.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Status</p>
                  <p className={`text-lg font-black ${studentData.status === 'Active' ? 'text-emerald-400' : 'text-rose-400'}`}>{studentData.status || 'N/A'}</p>
                </div>
                <button onClick={() => setShowRenewModal(true)} className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-black transition-all">Renew Membership</button>
              </div>
              <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-indigo-600 rounded-full blur-3xl opacity-20"></div>
            </div>
          </>
        )}

        {activeTab === "attendance" && (
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-6 rounded-2xl text-center">
                <p className="text-sm font-bold text-green-600">Present</p>
                <p className="text-4xl font-black text-green-700">{attendanceStats.totalPresent || 0}</p>
              </div>
              <div className="bg-red-50 p-6 rounded-2xl text-center">
                <p className="text-sm font-bold text-red-600">Absent</p>
                <p className="text-4xl font-black text-red-700">{attendanceStats.totalAbsent || 0}</p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-2xl text-center">
                <p className="text-sm font-bold text-indigo-600">Total Days</p>
                <p className="text-4xl font-black text-indigo-700">{attendanceStats.totalDays || 0}</p>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleMonthChange("prev")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <span className="text-xl font-bold text-slate-600">←</span>
                  </button>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <CalendarIcon size={20} />
                    {new Date(currentYear, currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button onClick={() => handleMonthChange("next")} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
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
                    
                    const isPresent = attendance.some(log => {
                      const logDate = new Date(log.date);
                      return logDate.getDate() === day && 
                             logDate.getMonth() === currentMonth && 
                             logDate.getFullYear() === currentYear && 
                             log.status === "Present";
                    });
                    
                    const isAbsent = attendance.some(log => {
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
                        className={`h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all
                          ${isPresent ? "bg-green-500 text-white shadow-md" : 
                            isAbsent ? "bg-red-500 text-white shadow-md" : 
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
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
              <h3 className="text-lg font-black text-slate-800 mb-4">Recent Logs</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {attendance.length > 0 ? attendance.slice(0, 10).map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${log.status === 'Present' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {log.status === 'Present' ? <CheckCircle size={18} /> : <XCircle size={18} />}
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

        {activeTab === "payments" && (
          <div className="lg:col-span-3 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h3 className="text-2xl font-black text-slate-800">Payment History</h3>
              <button 
                onClick={handleDownloadPayments}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs hover:bg-emerald-600 hover:text-white transition-all group"
              >
                <FileText size={16} className="group-hover:scale-110 transition-transform"/> EXPORT ALL RECEIPTS
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-4">
                    <th className="pb-2 pl-6">Date</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 pr-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? payments.map((p, idx) => (
                    <tr key={idx} className="bg-slate-50/50 hover:bg-slate-50 transition-colors group">
                      <td className="py-5 pl-6 rounded-l-[1.5rem] font-bold text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-5 font-black text-slate-800">{p.description || 'Monthly Membership Fee'}</td>
                      <td className="py-5 font-black text-emerald-600">₹{p.amount}</td>
                      <td className="py-5">
                        <span className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Paid</span>
                      </td>
                      <td className="py-5 pr-6 text-right rounded-r-[1.5rem]">
                        <button onClick={handleDownloadPayments} className="text-indigo-600 font-bold text-sm hover:underline">Download Receipt</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">No payment records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Renew Membership Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">Renew Membership</h3>
              <button onClick={() => setShowRenewModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Duration</label>
                <select 
                  value={renewData.durationMonths} 
                  onChange={(e) => setRenewData({...renewData, durationMonths: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600"
                >
                  <option value="1">1 Month</option>
                  <option value="3">3 Months</option>
                  <option value="6">6 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Seat Type</label>
                <select 
                  value={renewData.seatType} 
                  onChange={(e) => setRenewData({...renewData, seatType: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600"
                >
                  <option value="Non-AC">Non-AC (₹600/month)</option>
                  <option value="AC">AC (₹800/month)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Payment Method</label>
                <select 
                  value={renewData.paymentMethod} 
                  onChange={(e) => setRenewData({...renewData, paymentMethod: e.target.value})}
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600"
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Online</option>
                </select>
              </div>

              <div className="p-6 bg-indigo-50 rounded-2xl">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount</p>
                <p className="text-3xl font-black text-indigo-600">
                  ₹{(renewData.seatType === "AC" ? 800 : 600) * parseInt(renewData.durationMonths)}
                </p>
              </div>

              <button 
                onClick={handleRenewMembership}
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Confirm Renewal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simplified Sub-component
const DetailCard = ({ icon, label, value, isEditing, name, onChange, isSelect, options, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5 shadow-sm transition-all hover:shadow-md">
    <div className={`p-4 bg-slate-50 rounded-2xl ${color}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      {isEditing ? (
        isSelect ? (
          <select name={name} value={value} onChange={onChange} className="w-full font-black text-slate-800 outline-none bg-indigo-50 rounded-lg px-2 py-1 border-b-2 border-indigo-500">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input name={name} value={value} onChange={onChange} className="w-full font-black text-slate-800 outline-none bg-indigo-50 rounded-lg px-2 py-1 border-b-2 border-indigo-500" />
        )
      ) : (
        <p className="text-lg font-black text-slate-800 truncate">{value}</p>
      )}
    </div>
  </div>
);

export default StudentDetail;