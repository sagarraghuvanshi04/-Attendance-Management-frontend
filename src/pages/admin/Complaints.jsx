import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import Loader from "../../components/Loader";

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseData, setResponseData] = useState({ status: "", response: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints/all");
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!responseData.status || !responseData.response.trim()) {
      toast.error("Please select status and enter response");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/complaints/respond/${selectedComplaint._id}`, responseData);
      toast.success("Response submitted successfully!");
      setSelectedComplaint(null);
      setResponseData({ status: "", response: "" });
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to respond");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved": return "bg-green-50 text-green-600 border-green-200";
      case "In Progress": return "bg-blue-50 text-blue-600 border-blue-200";
      case "Rejected": return "bg-red-50 text-red-600 border-red-200";
      default: return "bg-amber-50 text-amber-600 border-amber-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved": return <CheckCircle size={16} />;
      case "In Progress": return <Clock size={16} />;
      case "Rejected": return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return <Loader message="Loading Complaints..." />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800">Student Complaints & Suggestions</h2>
        <p className="text-slate-500 font-medium">Manage student feedback</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {complaints.length > 0 ? (
          complaints.map((complaint) => (
            <div key={complaint._id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      complaint.type === "Complaint" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {complaint.type}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${getStatusColor(complaint.status)}`}>
                      {getStatusIcon(complaint.status)}
                      {complaint.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800">{complaint.subject}</h3>
                  <p className="text-sm text-slate-600 mt-1">{complaint.description}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 mb-3">
                <p className="text-xs font-bold text-slate-500">Student Details</p>
                <p className="text-sm font-bold text-slate-800">{complaint.student?.name} ({complaint.student?.studentId})</p>
                <p className="text-xs text-slate-500">{complaint.student?.email}</p>
              </div>

              {complaint.response ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-1">Response:</p>
                  <p className="text-sm text-green-600">{complaint.response}</p>
                  {complaint.respondedBy && (
                    <p className="text-xs text-green-500 mt-1">- {complaint.respondedBy.name}</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setResponseData({ status: "In Progress", response: "" });
                  }}
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Respond
                </button>
              )}

              <p className="text-xs text-slate-400 mt-3">
                {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <MessageSquare size={48} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-400">No complaints yet</p>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedComplaint(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black text-slate-800 mb-4">Respond to {selectedComplaint.type}</h3>
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <p className="text-sm font-bold text-slate-700">{selectedComplaint.subject}</p>
              <p className="text-xs text-slate-500 mt-1">{selectedComplaint.description}</p>
            </div>

            <form onSubmit={handleRespond} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                <select
                  value={responseData.status}
                  onChange={(e) => setResponseData({ ...responseData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Status</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Response Message</label>
                <textarea
                  value={responseData.response}
                  onChange={(e) => setResponseData({ ...responseData, response: e.target.value })}
                  placeholder="Enter your response..."
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {submitting ? "Sending..." : "Send Response"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
