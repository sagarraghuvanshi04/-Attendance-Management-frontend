import React, { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import { 
  IndianRupee, ArrowUpRight, Download, Calendar, 
  CheckCircle2, Clock, AlertCircle, FileText, Search, X, Check 
} from "lucide-react";

const ManagePayments = () => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    studentId: "", amount: "", method: "Cash", month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [duration, setDuration] = useState(1);
  const [rejectionMessage, setRejectionMessage] = useState("");

  useEffect(() => {
    fetchPayments();
    fetchPendingPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      const payments = res.data?.payments?.map(p => ({
        ...p,
        student: p.student || { name: "Unknown" }
      })) || [];
      setTransactions(payments);

      const studentsRes = await api.get("/students");
      setStudents(studentsRes.data.students || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const res = await api.get("/payments/pending");
      setPendingPayments(res.data?.payments || []);
    } catch (err) {
      console.error("Failed to fetch pending payments:", err);
    }
  };

  const handleApprove = async (action) => {
    try {
      if (action === "reject" && !rejectionMessage.trim()) {
        toast.error("Please enter rejection reason");
        return;
      }
      await api.post(`/payments/approve/${selectedPayment._id}`, {
        action,
        durationMonths: duration,
        rejectionMessage: action === "reject" ? rejectionMessage : undefined
      });
      toast.success(action === "approve" ? "Payment approved!" : "Payment rejected!");
      setShowApprovalModal(false);
      setRejectionMessage("");
      fetchPayments();
      fetchPendingPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process payment");
    }
  };

  const totalReceived = transactions?.filter?.(t => t.status === "Paid")?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const pendingAmount = transactions?.filter?.(t => t.status === "Pending")?.reduce((sum, t) => sum + t.amount, 0) || 0;
  const overdueCount = transactions?.filter?.(t => t.status === "Pending")?.length || 0;

  const downloadReceipt = (txn) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); 
    doc.text("SP DIGITAL LAB", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Official Payment Receipt", 105, 28, { align: "center" });
    doc.setDrawColor(230);
    doc.rect(20, 40, 170, 60);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Transaction ID: ${txn.transactionId}`, 25, 50);
    doc.text(`Student Name: ${txn.student?.name || "Unknown"}`, 25, 60);
    doc.text(`Date: ${new Date(txn.date).toLocaleDateString()}`, 25, 70);
    doc.text(`Payment Method: ${txn.method}`, 25, 80);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Amount Paid: Rs. ${txn.amount}/-`, 25, 92);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text("This is a computer generated receipt.", 105, 120, { align: "center" });
    doc.save(`Receipt_${txn.transactionId}.pdf`);
  };

  const generateReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Monthly Revenue Report", 14, 15);
      const tableColumn = ["Txn ID", "Student", "Date", "Method", "Status", "Amount"];
      const tableRows = transactions.map(t => [
        t.transactionId,
        t.student?.name || "Unknown",
        new Date(t.date).toLocaleDateString(),
        t.method,
        t.status,
        `Rs. ${t.amount}`
      ]);
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], halign: 'center' },
        styles: { fontSize: 9 },
      });
      const finalY = doc.lastAutoTable.finalY || 30;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Total Revenue Collected: Rs. ${totalReceived}`, 14, finalY + 15);
      doc.setTextColor(200, 0, 0);
      doc.text(`Pending Collections: Rs. ${pendingAmount}`, 14, finalY + 25);
      doc.save("Monthly_Revenue_Report.pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/payments/${id}/status`, { status: newStatus });
      setTransactions(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));
      toast.success("Status updated successfully!");
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const handleAddPayment = async () => {
    if (!formData.studentId || !formData.amount) {
      return toast.error("Please select student and enter amount!");
    }
    try {
      setLoading(true);
      const res = await api.post("/payments/create", {
        studentId: formData.studentId,
        amount: parseInt(formData.amount),
        method: formData.method,
        month: formData.month,
        status: "Paid"
      });
      toast.success("Payment added successfully!");
      setTransactions(prev => [res.data.payment, ...prev]);
      setShowModal(false);
      setFormData({ studentId: "", amount: "", method: "Cash", month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) });
    } catch (err) {
      console.error("Failed to add payment:", err);
      toast.error(err.response?.data?.message || "Failed to add payment");
    } finally {
      setLoading(false);
    }
  };

  const filteredTxns = useMemo(() => {
    return transactions.filter(t => {
      const matchesStatus = filter === "All" || t.status === filter;
      const matchesSearch = (t.student?.name?.toLowerCase().includes(search.toLowerCase()) || t.transactionId?.toLowerCase().includes(search.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [filter, search, transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Financial Ledger</h2>
          <p className="text-slate-500 font-medium italic">Managed by Library Admin</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-[1.5rem] font-bold hover:bg-indigo-700 transition-all shadow-xl active:scale-95">
            + Add Payment
          </button>
          <button onClick={generateReport} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            <FileText size={20} /> Generate Report
          </button>
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-6">
          <h3 className="text-lg font-black text-amber-900 mb-4 flex items-center gap-2">
            <Clock size={20} /> Pending Approvals ({pendingPayments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPayments.map(payment => (
              <div key={payment._id} className="bg-white rounded-2xl p-4 border border-amber-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-black text-slate-800">{payment.student?.name}</p>
                    <p className="text-xs text-slate-500">{payment.student?.studentId}</p>
                  </div>
                  <span className="text-lg font-black text-indigo-600">₹{payment.amount}</span>
                </div>
                <p className="text-xs text-slate-600 mb-1"><span className="font-bold">Txn ID:</span> {payment.transactionId}</p>
                <p className="text-xs text-slate-600 mb-3"><span className="font-bold">Date:</span> {new Date(payment.date).toLocaleDateString()}</p>
                <button
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowApprovalModal(true);
                  }}
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
                >
                  Review Payment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="flex justify-between mb-6">
            <div className="bg-white/20 p-3 rounded-2xl"><IndianRupee /></div>
            <div className="flex items-center gap-1 text-xs font-bold bg-emerald-500 px-2 py-1 rounded-lg">Live</div>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Total Received</p>
          <p className="text-4xl font-black mt-2">₹{totalReceived.toLocaleString()}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm border-slate-100">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl w-fit mb-6"><Clock size={24} /></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Pending Dues</p>
          <p className="text-4xl font-black mt-2 text-slate-800">₹{pendingAmount.toLocaleString()}</p>
          <p className="mt-4 text-xs font-bold text-red-500">{overdueCount} Students Overdue</p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
          <div className="bg-white/10 p-3 rounded-2xl w-fit mb-6"><Calendar size={24} /></div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Next Payout</p>
          <p className="text-3xl font-black mt-2">01 Feb 2026</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col lg:flex-row justify-between gap-6 border-b border-slate-50">
          <h3 className="text-xl font-black text-slate-800">Recent Transactions</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-4 rounded-xl border border-slate-100 focus-within:ring-2 ring-indigo-500/20 transition-all">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Search Txn ID or Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none py-2 text-sm font-bold text-slate-600"
              />
            </div>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {["All", "Paid", "Pending", "Failed"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                    filter === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400">
              <tr>
                <th className="px-8 py-5">Txn ID</th>
                <th className="px-8 py-5">Student</th>
                <th className="px-8 py-5">Date & Method</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5 text-center">Receipt / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTxns.length > 0 ? filteredTxns.map(t => (
                <tr key={t._id} className="group hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6 text-xs font-bold text-slate-400">{t.transactionId}</td>
                  <td className="px-8 py-6 font-bold text-slate-800">{t.student?.name || "Unknown"}</td>
                  <td className="px-8 py-6">
                    <p className="font-bold text-sm text-slate-600">{new Date(t.date).toLocaleDateString()}</p>
                    <p className="text-[10px] uppercase font-black text-slate-400">{t.method}</p>
                  </td>
                  <td className="px-8 py-6">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900">₹{t.amount}</td>
                  <td className="px-8 py-6 text-center flex justify-center gap-2">
                    <button
                      disabled={t.status !== "Paid"}
                      onClick={() => downloadReceipt(t)}
                      className={`p-3 rounded-xl transition-all ${
                        t.status === "Paid"
                          ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white"
                          : "text-slate-200 cursor-not-allowed"
                      }`}
                    >
                      <Download size={18} />
                    </button>
                    {["Paid", "Pending", "Failed"].map(status => (
                      <button
                        key={status}
                        onClick={() => updateStatus(t._id, status)}
                        className={`px-2 py-1 text-[10px] rounded-lg border ${
                          t.status === status ? "bg-indigo-600 text-white" : "bg-white text-slate-600"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center text-slate-400 font-bold italic">No matching records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Add New Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase">Select Student</label>
                <select value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600">
                  <option value="">Choose Student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase">Amount (₹)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="5000" className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase">Payment Method</label>
                <select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600">
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Online</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-100 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleAddPayment} disabled={loading} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    "Add Payment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-800">Review Payment</h3>
              <button onClick={() => setShowApprovalModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-slate-600 mb-2">Student Details</p>
              <p className="font-black text-lg text-slate-800">{selectedPayment.student?.name}</p>
              <p className="text-xs text-slate-500">{selectedPayment.student?.studentId} • {selectedPayment.student?.phone}</p>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-indigo-600 mb-2">Payment Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-black text-slate-800">₹{selectedPayment.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Transaction ID</p>
                  <p className="font-bold text-slate-600 text-xs">{selectedPayment.transactionId}</p>
                </div>
              </div>
              {selectedPayment.description && (
                <p className="text-xs text-slate-600 mt-2">{selectedPayment.description}</p>
              )}
            </div>

            {selectedPayment.paymentProof && (
              <div className="mb-4">
                <p className="text-sm font-bold text-slate-600 mb-2">Payment Screenshot</p>
                <img src={selectedPayment.paymentProof} alt="Payment Proof" className="w-full rounded-xl border" />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Plan Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Rejection Reason (if rejecting)</label>
              <textarea
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove("reject")}
                className="flex-1 bg-red-100 text-red-600 py-3 rounded-xl font-bold hover:bg-red-200 transition-all"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove("approve")}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    Paid: ["bg-emerald-50 text-emerald-600 border-emerald-100", <CheckCircle2 size={12} />],
    Pending: ["bg-amber-50 text-amber-600 border-amber-100", <Clock size={12} />],
    Failed: ["bg-red-50 text-red-600 border-red-100", <AlertCircle size={12} />],
  };
  return (
    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest w-fit ${map[status][0]}`}>
      {map[status][1]} {status}
    </span>
  );
};

export default ManagePayments;
