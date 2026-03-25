import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getOutgoingRequests } from '../../services/coachingService';
import { CoachingRequest, CoachingRequestStatus, PublicAthleteProfile } from '../../types/coaching';

interface MyAthletesListProps {
  onCreatePlan: (athleteId: string, username: string) => void;
}

type RequestWithAthlete = CoachingRequest & { athlete: PublicAthleteProfile };

function StatusBadge({ status }: { status: CoachingRequestStatus }) {
  const { t } = useTranslation();

  const classes: Record<CoachingRequestStatus, string> = {
    pending: 'bg-gray-100 text-gray-600',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${classes[status]}`}>
      {t(`coaching.status.${status}`)}
    </span>
  );
}

export function MyAthletesList({ onCreatePlan }: MyAthletesListProps) {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RequestWithAthlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRequests() {
      try {
        const data = await getOutgoingRequests();
        if (!cancelled) {
          setRequests(data);
        }
      } catch (err) {
        console.error('Error fetching outgoing coaching requests:', err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        ...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
        {t('coaching.noAthletes')}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {request.athlete.full_name || request.athlete.username}
              </p>
              <p className="text-xs text-gray-500">@{request.athlete.username}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>

          {request.status === 'approved' && (
            <button
              onClick={() => onCreatePlan(request.athlete_id, request.athlete.username)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {t('coaching.createPlan')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
