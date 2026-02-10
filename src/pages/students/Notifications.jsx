import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Bell, Clock, AlertCircle, Info as InfoIcon } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await api.post("/notifications/mark-read", {
        notificationIds: [notifId],
      });
      setNotifications(prev =>
        prev.map(n => 
          n._id === notifId ? { ...n, isRead: true } : n
        )
      );
      window.dispatchEvent(new Event('notificationsRead'));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const typeColors = {
    info: { read: "bg-slate-50 text-slate-600 border-slate-200", unread: "bg-blue-100 text-blue-700 border-blue-300" },
    alert: { read: "bg-slate-50 text-slate-600 border-slate-200", unread: "bg-red-100 text-red-700 border-red-300" },
    warning: { read: "bg-slate-50 text-slate-600 border-slate-200", unread: "bg-amber-100 text-amber-700 border-amber-300" },
    success: { read: "bg-slate-50 text-slate-600 border-slate-200", unread: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  };

  const typeIcons = {
    info: <InfoIcon size={20} />,
    alert: <AlertCircle size={20} />,
    warning: <AlertCircle size={20} />,
    success: <Bell size={20} />,
  };

  if (loading) {
    return <div className="text-center py-10 font-bold text-slate-400">Loading...</div>;
  }

  return (
    <div className="p-4 mx-auto space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          Notifications
          {unreadCount > 0 && (
            <span className="text-xs md:text-sm font-bold bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </h2>
        <p className="text-sm md:text-base text-slate-500 font-medium">Stay updated with library announcements</p>
      </div>

      <div className="space-y-3 md:space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const unread = !notif.isRead;
            const colors = typeColors[notif.type] || typeColors.info;
            
            return (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 transition-all cursor-pointer hover:shadow-md ${
                  unread ? colors.unread : colors.read
                } ${unread ? 'animate-in fade-in slide-in-from-top duration-300' : ''}`}
              >
                <div className="flex gap-3 md:gap-4">
                  <div className="shrink-0">{typeIcons[notif.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-black text-base md:text-lg">{notif.title}</h4>
                      {unread && (
                        <span className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0 mt-2 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs md:text-sm font-medium opacity-80 mb-2">{notif.message}</p>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold opacity-60">
                      <Clock size={12} />
                      {new Date(notif.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-24 w-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No Notifications</h3>
            <p className="text-slate-400">We'll let you know when something happens.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
