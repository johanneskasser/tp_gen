import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Users } from 'lucide-react';
import { AthleteSearch } from '../components/coaching/AthleteSearch';
import { RequestsList } from '../components/coaching/RequestsList';
import { ApprovedAthletesList } from '../components/coaching/ApprovedAthletesList';

type Tab = 'requests' | 'athletes';

export default function CoachingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [refreshKey, setRefreshKey] = useState(0);
  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [athleteCount, setAthleteCount] = useState<number | null>(null);

  const handleRequestSent = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleCreatePlan = (athleteId: string, username: string) => {
    navigate('/plan/new', { state: { coachingContext: { athleteId, username } } });
  };

  const tabs: { id: Tab; icon: React.ReactNode; count?: number | null }[] = [
    { id: 'requests', icon: <Search className="w-4 h-4" />, count: requestCount },
    { id: 'athletes', icon: <Users className="w-4 h-4" />, count: athleteCount },
  ];

  return (
    <div className="py-8 px-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('coaching.title')}</h1>
        <p className="text-gray-500 mt-1 text-sm">{t('coaching.subtitle')}</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map(({ id, icon, count }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {icon}
              {t(`coaching.tabs.${id}`)}
              {typeof count === 'number' && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'requests' && (
        <div className="max-w-lg space-y-6">
          <AthleteSearch onRequestSent={handleRequestSent} />
          <RequestsList refreshKey={refreshKey} onCountChange={setRequestCount} />
        </div>
      )}
      {activeTab === 'athletes' && (
        <ApprovedAthletesList
          refreshKey={refreshKey}
          onCreatePlan={handleCreatePlan}
          onCountChange={setAthleteCount}
        />
      )}
    </div>
  );
}
