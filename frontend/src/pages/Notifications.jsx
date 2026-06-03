import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/common/Loader';
import { format } from 'timeago.js';
import {
  HiBell, HiCheck, HiUserAdd, HiChat, HiHeart,
  HiShoppingBag, HiSpeakerphone, HiClipboardList,
} from 'react-icons/hi';

const typeIcon = {
  follow:      { Icon: HiUserAdd,       color: 'text-brand-400',  bg: 'bg-brand-500/10' },
  like:        { Icon: HiHeart,         color: 'text-red-400',    bg: 'bg-red-500/10' },
  comment:     { Icon: HiChat,          color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  message:     { Icon: HiChat,          color: 'text-green-400',  bg: 'bg-green-500/10' },
  order:       { Icon: HiShoppingBag,   color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  application: { Icon: HiClipboardList, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  campaign:    { Icon: HiSpeakerphone,  color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Tell the sidebar badge to reset to 0 immediately
      window.dispatchEvent(new CustomEvent('notifications-read'));
    } catch { /* silent */ }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data.notifications);
        // Auto mark-all-read as soon as the page opens
        const hasUnread = data.notifications.some((n) => !n.isRead);
        if (hasUnread) {
          await api.put('/notifications/read-all');
          setNotifications(data.notifications.map((n) => ({ ...n, isRead: true })));
          window.dispatchEvent(new CustomEvent('notifications-read'));
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HiBell className="w-6 h-6 text-brand-400" />
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            <HiCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <Loader text="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <HiBell className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 font-medium">No notifications yet</p>
          <p className="text-gray-600 text-sm mt-1">We'll notify you when something happens</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = typeIcon[n.type] || typeIcon.message;
            const { Icon } = cfg;
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && markRead(n._id)}
                className={`card p-4 flex items-start gap-4 transition-all cursor-pointer hover:border-brand-500/30 ${
                  !n.isRead ? 'border-brand-500/20 bg-brand-500/5' : ''
                }`}
              >
                <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
                  {n.sender?.avatar ? (
                    <img src={n.sender.avatar} alt={n.sender.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  )}
                  {n.sender?.avatar && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${cfg.bg} border-2 border-dark-800`}>
                      <Icon className={`w-3 h-3 ${cfg.color}`} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.isRead ? 'text-gray-300' : 'text-white font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{format(n.createdAt)}</p>
                </div>

                {!n.isRead && (
                  <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-brand-500 mt-1.5" />
                )}

                {n.link && (
                  <Link
                    to={n.link}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 text-gray-500 hover:text-brand-400 transition-colors text-xs underline"
                  >
                    View
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;