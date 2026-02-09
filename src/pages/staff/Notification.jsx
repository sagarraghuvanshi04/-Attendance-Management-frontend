import React, { useState, useEffect } from "react";
import { Bell, Send, Trash2, AlertCircle } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Notifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/notifications/create", { title, message, type });

      if (data.success) {
        toast.success("Notification broadcasted successfully!");
        setTitle("");
        setMessage("");
        setType("info");
        fetchNotifications();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to broadcast");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await api.delete(`/notifications/${id}`);
      if (data.success) {
        toast.success("Notification deleted");
        fetchNotifications();
      }
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const typeColors = {
    info: "bg-blue-50 text-blue-600 border-blue-200",
    alert: "bg-red-50 text-red-600 border-red-200",
    warning: "bg-amber-50 text-amber-600 border-amber-200",
    success: "bg-emerald-50 text-emerald-600 border-emerald-200",
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black text-slate-800">Broadcast Alerts</h2>
        <p className="text-slate-500 font-medium">Send quick notices to all active students.</p>
      </div>

      {/* Broadcast Form */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Notice Title</label>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="e.g. Library Closed Tomorrow" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Message</label>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="4" 
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="Write your message here..." 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Type</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="info">Info</option>
            <option value="alert">Alert</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
          </select>
        </div>

        <button 
          onClick={handleBroadcast}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
        >
          <Send size={20} /> {loading ? "Broadcasting..." : "Broadcast Message"}
        </button>
      </div>

      {/* Recent Notifications */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
          <Bell size={20} /> Recent Broadcasts
        </h3>
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif._id} className={`p-6 rounded-2xl border-2 ${typeColors[notif.type]}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-black text-lg mb-1">{notif.title}</h4>
                    <p className="text-sm font-medium opacity-80 mb-2">{notif.message}</p>
                    <p className="text-xs font-bold opacity-60">
                      By {notif.createdBy?.name} • {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">No broadcasts yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;