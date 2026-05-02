import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from "../../store/attendanceApi";
import toast from "react-hot-toast";

const typeIcon = {
  OT_APPROVED: "✅",
  OT_REJECTED: "❌",
  OT_REQUEST: "⚡",
  MISSED_PUNCH: "⚠️",
  VALIDATION_UPDATE: "🔍",
};

const typeColor = {
  OT_APPROVED: "border-green-400 bg-green-50",
  OT_REJECTED: "border-red-400 bg-red-50",
  OT_REQUEST: "border-orange-400 bg-orange-50",
  MISSED_PUNCH: "border-yellow-400 bg-yellow-50",
  VALIDATION_UPDATE: "border-blue-400 bg-blue-50",
};

export default function WorkNotifications() {
  const { data, isLoading, refetch } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkRead = async (id) => {
    await markRead(id).unwrap().catch(() => {});
    refetch();
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead().unwrap();
      toast.success("All notifications marked as read");
      refetch();
    } catch { toast.error("Failed"); }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} disabled={markingAll}
            className="text-sm text-indigo-600 hover:underline font-medium disabled:opacity-60">
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-16 text-center">
          <p className="text-4xl mb-3">🔔</p>
          <p className="text-gray-500 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n._id}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
              className={`rounded-2xl border-l-4 p-4 cursor-pointer transition hover:shadow-md ${typeColor[n.type] || "border-gray-300 bg-gray-50"} ${!n.isRead ? "shadow-sm" : "opacity-70"}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{typeIcon[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-gray-800 text-sm ${!n.isRead ? "" : "font-normal"}`}>
                      {n.title}
                      {!n.isRead && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
