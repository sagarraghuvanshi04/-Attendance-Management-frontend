import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Trash2, Calendar, User, Clock } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await api.post("/notifications/mark-read", {
        notificationIds: [notifId],
      });
      setNotifications(notifications.map(n => 
        n._id === notifId ? { ...n, isRead: true } : n
      ));
      window.dispatchEvent(new Event('notificationsRead'));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    if (notif.title === "New Payment Request") {
      navigate("/admin/payments");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this notification?")) return;
    
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
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

      <div className="grid grid-cols-1 gap-6">
        {notifications.length > 0 ? notifications.map(notif => {
          const unread = !notif.isRead;
          return (
            <div 
              key={notif._id} 
              onClick={() => handleNotificationClick(notif)}
              className={`p-8 rounded-[2.5rem] border-2 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                unread 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 flex-1">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    notif.type === 'announcement' ? 'bg-rose-100 text-rose-600' :
                    notif.type === 'alert' ? 'bg-amber-100 text-amber-600' :
                    notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-indigo-100 text-indigo-600'
                  }`}>
                    <Bell size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xl font-black text-slate-800">{notif.title}</h3>
                      {unread && (
                        <span className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0 mt-2 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed mb-4">{notif.message}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(notif.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {notif.createdBy && (
                        <span className="flex items-center gap-1.5">
                          <User size={14} />
                          By: {notif.createdBy?.name || 'Admin'}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-lg uppercase tracking-wider ${
                        notif.type === 'announcement' ? 'bg-rose-50 text-rose-600' :
                        notif.type === 'alert' ? 'bg-amber-50 text-amber-600' :
                        notif.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {notif.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(notif._id, e)}
                  className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 text-center">
            <Bell size={64} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-lg">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
