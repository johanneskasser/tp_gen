import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AthleteSearch } from '../components/coaching/AthleteSearch';
import { MyAthletesList } from '../components/coaching/MyAthletesList';

export default function CoachingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreatePlan = (athleteId: string, username: string) => {
    navigate('/plan/new', { state: { coachingContext: { athleteId, username } } });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t('coaching.title')}</h1>
        <p className="text-gray-500 mt-1">{t('coaching.subtitle')}</p>
      </div>
      <AthleteSearch onRequestSent={() => setRefreshKey(k => k + 1)} />
      <MyAthletesList key={refreshKey} onCreatePlan={handleCreatePlan} />
    </div>
  );
}
