import React, { useState, useEffect } from "react";
import { Bell, Send, Mail, Calendar, AlertCircle, CheckCircle2, Users } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const PaymentReminders = () => {
  const [expiringStudents, setExpiringStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [sending, setSending] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);

  useEffect(() => {
    fetchExpiringStudents();
  }, [days]);

  const fetchExpiringStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/payment-reminders/expiring-students?days=${days}`);
      setExpiringStudents(res.data.students || []);
    } catch (err) {
      console.error("Failed to fetch expiring students:", err);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (studentId) => {
    try {
      setSending(studentId);
      const res = await api.post(`/payment-reminders/send/${studentId}`);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminder");
    } finally {
      setSending(false);
    }
  };

  const sendBulkReminders = async () => {
    try {
      setSendingBulk(true);
      const res = await api.post("/payment-reminders/send-bulk", { daysBeforeExpiry: days });
      toast.success(`${res.data.success} reminders sent successfully`);
      fetchExpiringStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send bulk reminders");
    } finally {
      setSendingBulk(false);
    }
  };

  const getStatusColor = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 0) return "bg-red-100 text-red-700 border-red-200";
    if (daysUntilExpiry <= 3) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  const getStatusText = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 0) return "EXPIRED";
    if (daysUntilExpiry === 1) return "Expires Today";
    return `${daysUntilExpiry} days left`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="text-indigo-600" size={28} />
          <h1 className="text-2xl font-black text-slate-800">Payment Reminders</h1>
        </div>
        <p className="text-slate-500 text-sm">Send payment reminder emails to students with expiring memberships</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-xs font-bold uppercase mb-1">Expired</p>
              <p className="text-3xl font-black text-red-700">
                {expiringStudents.filter(s => s.daysUntilExpiry <= 0).length}
              </p>
            </div>
            <AlertCircle className="text-red-400" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-xs font-bold uppercase mb-1">Expiring Soon</p>
              <p className="text-3xl font-black text-orange-700">
                {expiringStudents.filter(s => s.daysUntilExpiry > 0 && s.daysUntilExpiry <= 3).length}
              </p>
            </div>
            <Calendar className="text-orange-400" size={40} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-xs font-bold uppercase mb-1">Total Students</p>
              <p className="text-3xl font-black text-yellow-700">{expiringStudents.length}</p>
            </div>
            <Users className="text-yellow-400" size={40} />
          </div>
        </div>
      </div>

      {/* Filter & Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-bold text-slate-700">Show students expiring within:</label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="15">15 days</option>
              <option value="30">30 days</option>
            </select>
          </div>

          <button
            onClick={sendBulkReminders}
            disabled={sendingBulk || expiringStudents.length === 0}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail size={18} />
            {sendingBulk ? "Sending..." : `Send Bulk Reminders (${expiringStudents.length})`}
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-800">Students List</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-slate-500 mt-3 text-sm">Loading students...</p>
          </div>
        ) : expiringStudents.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3" />
            <p className="text-slate-600 font-bold">No students with expiring memberships</p>
            <p className="text-slate-400 text-sm mt-1">All memberships are up to date!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase font-bold text-slate-500">
                  <th className="px-6 py-4 text-left">Student</th>
                  <th className="px-6 py-4 text-left">Contact</th>
                  <th className="px-6 py-4 text-left">Seat</th>
                  <th className="px-6 py-4 text-left">Expiry Date</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiringStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.studentId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{student.email}</p>
                      <p className="text-xs text-slate-400">{student.phone || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                        {student.seat || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {new Date(student.expiry).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusColor(student.daysUntilExpiry)}`}>
                        {getStatusText(student.daysUntilExpiry)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => sendReminder(student.studentId)}
                        disabled={sending === student.studentId}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
                      >
                        <Send size={14} />
                        {sending === student.studentId ? "Sending..." : "Send"}
                      </button>
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

export default PaymentReminders;
