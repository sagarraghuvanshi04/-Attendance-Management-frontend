import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { MessageSquare, Send, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "Complaint",
    subject: "",
    description: "",
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints/my-complaints");
      setComplaints(res.data.complaints || []);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/complaints/create", formData);
      toast.success(`${formData.type} submitted successfully!`);
      setFormData({ type: "Complaint", subject: "", description: "" });
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-green-50 text-green-600 border-green-200";
      case "In Progress":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "Rejected":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-amber-50 text-amber-600 border-amber-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle size={16} />;
      case "In Progress":
        return <Clock size={16} />;
      case "Rejected":
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800">Complaints & Suggestions</h2>
        <p className="text-sm md:text-base text-slate-500 font-medium">Share your feedback with us</p>
      </div>

      {/* Submit Form */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg md:text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
          <MessageSquare size={20} /> Submit New
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Complaint">Complaint</option>
              <option value="Suggestion">Suggestion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief subject..."
              className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe in detail..."
              rows="4"
              className="w-full px-4 py-2 md:py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-6 border border-slate-100 shadow-sm">
        <h3 className="text-lg md:text-xl font-black text-slate-800 mb-4">Your Submissions</h3>
        <div className="space-y-4">
          {complaints.length > 0 ? (
            complaints.map((complaint) => (
              <div key={complaint._id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      complaint.type === "Complaint" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {complaint.type}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${getStatusColor(complaint.status)}`}>
                    {getStatusIcon(complaint.status)}
                    {complaint.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-800 mb-1">{complaint.subject}</h4>
                <p className="text-sm text-slate-600 mb-2">{complaint.description}</p>
                {complaint.response && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-xs font-bold text-green-700 mb-1">Response:</p>
                    <p className="text-sm text-green-600">{complaint.response}</p>
                    {complaint.respondedBy && (
                      <p className="text-xs text-green-500 mt-1">- {complaint.respondedBy.name}</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(complaint.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
              <p className="font-bold">No submissions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Complaints;
