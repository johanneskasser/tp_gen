import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { AppNotification, CoachingRequestNotificationPayload, CoachingPlanNotificationPayload } from '../../types/coaching';

interface NotificationItemProps {
  notification: AppNotification;
  responseStatus?: 'approved' | 'rejected';
  onApproveRequest: (requestId: string) => Promise<void>;
  onRejectRequest: (requestId: string) => Promise<void>;
}

export function NotificationItem({ notification, responseStatus, onApproveRequest, onRejectRequest }: NotificationItemProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (notification.type === 'coaching_request') {
    const payload = notification.payload as CoachingRequestNotificationPayload;
    const coachName = payload.coach.full_name || `@${payload.coach.username}`;

    return (
      <div className="flex flex-col gap-2 p-3 border-b last:border-b-0">
        <div>
          <span className="font-medium">{coachName}</span>
          <span className="text-sm text-gray-500 ml-1">@{payload.coach.username}</span>
        </div>
        <p className="text-sm text-gray-500">
          {t('notifications.coachingRequestBody')}
        </p>
        {responseStatus ? (
          <span className={`text-sm font-medium ${responseStatus === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
            {responseStatus === 'approved' ? t('notifications.approved') : t('notifications.rejected')}
          </span>
        ) : (
          <div className="flex gap-2">
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                await onApproveRequest(payload.request_id);
                setLoading(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Check size={14} /> {t('notifications.approve')}
            </button>
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                await onRejectRequest(payload.request_id);
                setLoading(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <X size={14} /> {t('notifications.reject')}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (notification.type === 'coaching_plan_received') {
    const payload = notification.payload as CoachingPlanNotificationPayload;
    const coachName = payload.coach.full_name || `@${payload.coach.username}`;
    return (
      <div className="flex flex-col gap-2 p-3 border-b last:border-b-0">
        <div>
          <span className="font-medium">{coachName}</span>
          <span className="text-sm text-gray-500 ml-1">@{payload.coach.username}</span>
        </div>
        <p className="text-sm text-gray-500">
          {payload.plan_name} · {payload.distance} · {payload.weeks} Wochen
        </p>
        <button
          onClick={() => navigate(`/plan/${payload.plan_id}`)}
          className="text-sm text-blue-600 font-medium text-left"
        >
          {t('notifications.viewPlan')} →
        </button>
      </div>
    );
  }

  return null;
}
