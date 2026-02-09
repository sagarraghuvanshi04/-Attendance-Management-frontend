import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Bell, ArrowLeft, Megaphone, AlertCircle, Info, CheckCircle, Plus, X, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "announcement"
  });

  useEffect(() => {
    fetchNotifications();
    const read = JSON.parse(localStorage.getItem("staffReadNotifications") || "[]");
    setReadNotifications(read);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (error) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notifId) => {
    if (!readNotifications.includes(notifId)) {
      const updated = [...readNotifications, notifId];
      setReadNotifications(updated);
      localStorage.setItem("staffReadNotifications", JSON.stringify(updated));
      window.dispatchEvent(new Event('notificationsRead'));
    }
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif._id);
    if (notif.title === "New Payment Request") {
      navigate("/staff/payments");
    }
  };

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error("Title and message are required");
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/notifications/broadcast", formData);
      if (res.data.success) {
        toast.success("Broadcast sent successfully!");
        setShowModal(false);
        setFormData({ title: "", message: "", type: "announcement" });
        fetchNotifications();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send broadcast");
    } finally {
      setCreating(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "announcement":
        return <Megaphone size={20} />;
      case "alert":
        return <AlertCircle size={20} />;
      case "success":
        return <CheckCircle size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "announcement":
        return "bg-indigo-100 text-indigo-600 border-indigo-200";
      case "alert":
        return "bg-red-100 text-red-600 border-red-200";
      case "success":
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      default:
        return "bg-blue-100 text-blue-600 border-blue-200";
    }
  };

  const isUnread = (notifId) => !readNotifications.includes(notifId);
  const unreadCount = notifications.filter(n => isUnread(n._id)).length;

  if (loading) {
    return <Loader message="Loading Notifications..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/staff/dashboard")}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="text-sm font-bold bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-slate-500 font-medium">All announcements and updates</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
          >
            <Plus size={20} /> Create Broadcast
          </button>
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl">
            <Bell size={18} className="text-indigo-600" />
            <span className="font-bold text-indigo-600">{notifications.length} Total</span>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const unread = isUnread(notif._id);
            return (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-6 rounded-3xl border-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  unread 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${getTypeColor(notif.type)}`}>
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-black text-slate-900 text-lg">{notif.title}</h3>
                      {unread && (
                        <span className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0 mt-2 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-slate-600 mb-3">{notif.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="font-bold uppercase flex items-center gap-1">
                        <Clock size={12} />
                        {notif.type}
                      </span>
                      <span>•</span>
                      <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center">
            <Bell size={64} className="mx-auto text-slate-300 mb-4" strokeWidth={1} />
            <h3 className="text-xl font-black text-slate-400 uppercase">No Notifications</h3>
            <p className="text-slate-400 mt-2">You're all caught up!</p>
          </div>
        )}
      </div>

      {/* Create Broadcast Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-all"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-6">Create Broadcast</h3>

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  placeholder="Enter broadcast title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                  placeholder="Enter your message"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                >
                  <option value="announcement">Announcement</option>
                  <option value="info">Info</option>
                  <option value="alert">Alert</option>
                  <option value="success">Success</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Sending..." : "Send Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
