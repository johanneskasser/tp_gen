import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, XCircle } from 'lucide-react';
import { getOutgoingRequests, sendCoachingRequest } from '../../services/coachingService';
import { CoachingRequest, CoachingRequestStatus, PublicAthleteProfile } from '../../types/coaching';
import { useToast } from '../../contexts/ToastContext';

interface RequestsListProps {
  refreshKey: number;
  onCountChange?: (count: number) => void;
}

type RequestWithAthlete = CoachingRequest & { athlete: PublicAthleteProfile };

function AvatarInitials({ name, username }: { name: string | null; username: string }) {
  const display = name || username;
  const initials = display.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {initials || '?'}
    </div>
  );
}

function StatusBadge({ status }: { status: CoachingRequestStatus }) {
  const { t } = useTranslation();
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
        <Clock className="w-3 h-3" />
        {t('coaching.status.pending')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
      <XCircle className="w-3 h-3" />
      {t('coaching.status.rejected')}
    </span>
  );
}

export function RequestsList({ refreshKey, onCountChange }: RequestsListProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const [requests, setRequests] = useState<RequestWithAthlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reRequesting, setReRequesting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getOutgoingRequests()
      .then((data) => {
        if (!cancelled) {
          const filtered = data.filter((r) => r.status !== 'approved');
          setRequests(filtered);
          onCountChange?.(filtered.length);
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleReRequest = async (request: RequestWithAthlete) => {
    setReRequesting((prev) => ({ ...prev, [request.id]: true }));
    try {
      await sendCoachingRequest(request.athlete_id);
      toast.success(t('coaching.requestSent'));
      // Refresh by updating local state
      setRequests((prev) =>
        prev.map((r) => r.id === request.id ? { ...r, status: 'pending' as CoachingRequestStatus } : r)
      );
    } catch {
      toast.error('Fehler beim Senden der Anfrage');
    } finally {
      setReRequesting((prev) => ({ ...prev, [request.id]: false }));
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-400 text-center py-8">...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">{t('coaching.noRequests')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <div key={request.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
          <AvatarInitials name={request.athlete.full_name} username={request.athlete.username} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {request.athlete.full_name || request.athlete.username}
            </p>
            <p className="text-xs text-gray-500">@{request.athlete.username}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={request.status} />
            {request.status === 'rejected' && (
              <button
                onClick={() => handleReRequest(request)}
                disabled={reRequesting[request.id]}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                {reRequesting[request.id] ? '...' : t('coaching.reRequest')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
