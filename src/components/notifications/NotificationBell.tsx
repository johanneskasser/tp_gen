import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppNotification } from '../../types/coaching';
import {
  getNotifications,
  getUnreadCount,
  markNotificationsRead,
  respondToRequest,
} from '../../services/coachingService';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getNotifications().then(setNotifications).catch(console.error);
    getUnreadCount().then(setUnreadCount).catch(console.error);
  }, []);

  const handleOpen = async () => {
    setOpen(true);
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markNotificationsRead(unreadIds).catch(console.error);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleApprove = async (requestId: string) => {
    await respondToRequest(requestId, 'approved');
  };

  const handleReject = async (requestId: string) => {
    await respondToRequest(requestId, 'rejected');
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label={t('notifications.title')}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={22} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setOpen(false)}
          onApproveRequest={handleApprove}
          onRejectRequest={handleReject}
        />
      )}
    </div>
  );
}
