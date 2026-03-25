import { useTranslation } from 'react-i18next';
import { AppNotification } from '../../types/coaching';
import { NotificationItem } from './NotificationItem';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onClose: () => void;
  onApproveRequest: (requestId: string) => Promise<void>;
  onRejectRequest: (requestId: string) => Promise<void>;
}

export function NotificationPanel({
  notifications,
  onClose,
  onApproveRequest,
  onRejectRequest,
}: NotificationPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Backdrop for closing */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Panel: bottom sheet on mobile, dropdown on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-xl shadow-lg max-h-[80vh] overflow-y-auto sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:w-[380px] sm:rounded-xl sm:mt-2">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-base">{t('notifications.title')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            {t('notifications.empty')}
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                responseStatus={n.request_status}
                onApproveRequest={onApproveRequest}
                onRejectRequest={onRejectRequest}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
