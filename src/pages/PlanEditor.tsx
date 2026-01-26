import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrainingPlan, TrainingWeek, RaceEvent } from '../types';
import { calculateWeeks } from '../utils/dateUtils';
import { calculateWeeklyKm, getRaceDistanceKm } from '../utils/calculationUtils';
import EventConfig from '../components/EventConfig';
import WeeklyPlan from '../components/WeeklyPlan';
import WeeklyChart from '../components/WeeklyChart';
import PublishPlanModal from '../components/PublishPlanModal';
import ICalSubscriptionModal from '../components/ICalSubscriptionModal';
import { CompactPlanHeader } from '../components/CompactPlanHeader';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { exportToJSON, importFromJSON } from '../utils/jsonExportImport';
import { exportToFIT, importFromFIT } from '../utils/fitExportImport';
import { exportToICal } from '../utils/icalExport';
import { trainingPlanService, SavedTrainingPlan } from '../services/trainingPlanService';
import { TrainingSession } from '../types';
import { Button } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { useToast } from '../contexts/ToastContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';

export default function PlanEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { runnerProfile } = useRunnerProfile();
  const [isNewPlan, setIsNewPlan] = useState(id === 'new');

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedTrainingPlan | null>(null);
  const [showEventConfig, setShowEventConfig] = useState(isNewPlan);
  const [loading, setLoading] = useState(!isNewPlan);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing plan
  useEffect(() => {
    if (id && id !== 'new') {
      loadPlan(id);
    }
  }, [id]);

  // Auto-save effect (debounced) - now also works for new plans
  useEffect(() => {
    if (!plan) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      savePlan();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [plan]);

  const loadPlan = async (planId: string) => {
    try {
      setLoading(true);
      const loadedPlan = await trainingPlanService.getPlanById(planId);
      if (loadedPlan) {
        setPlan(loadedPlan.plan_data);
        setSavedPlan(loadedPlan);
        setShowEventConfig(false);
      } else {
        toast.error('Trainingsplan nicht gefunden');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Laden des Plans');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!plan) return;

    try {
      setSaving(true);
      if (isNewPlan) {
        // Create new plan
        const saved = await trainingPlanService.createPlan(plan);
        setSavedPlan(saved);
        setIsNewPlan(false); // Mark as no longer new
        // Navigate to edit mode with the new ID (without replacing history)
        navigate(`/plan/${saved.id}`, { replace: true });
      } else if (id) {
        // Update existing plan
        const updated = await trainingPlanService.updatePlan(id, plan);
        setSavedPlan(updated);
      }
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
      toast.error('Fehler beim Speichern des Plans');
    } finally {
      setSaving(false);
    }
  };

  const handleEventSubmit = (event: RaceEvent, startDate: string) => {
    const weekData = calculateWeeks(startDate, event.date);

    // If we're editing an existing plan, try to preserve existing sessions
    const existingSessions = plan?.weeks.flatMap(w => w.sessions.filter(s => s.type !== 'race')) || [];

    const weeks: TrainingWeek[] = weekData.map((week, index) => {
      const matchingSessions = existingSessions.filter(session => {
        const oldWeek = plan?.weeks.find(w =>
          w.sessions.some(s => s.id === session.id)
        );

        if (!oldWeek) return false;
        return oldWeek.weekNumber === week.weekNumber;
      });

      const sessions: TrainingSession[] = [...matchingSessions];

      // Add race session to the last week on the event date
      if (index === weekData.length - 1) {
        const eventDate = new Date(event.date);
        const eventDayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;

        const raceDistance = event.distance === 'CUSTOM'
          ? event.customDistance || 0
          : getRaceDistanceKm(event.distance);

        const raceSession: TrainingSession = {
          id: `race-${Date.now()}`,
          dayOfWeek: eventDayOfWeek,
          type: 'race' as const,
          title: event.name,
          distance: raceDistance,
          notes: event.targetTime ? `Zielzeit: ${event.targetTime}` : undefined,
        };

        sessions.push(raceSession);
      }

      return {
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        sessions,
        totalKm: calculateWeeklyKm(sessions),
        startDayOfWeek: week.startDayOfWeek,
      };
    });

    setPlan({
      event,
      startDate,
      weeks,
    });
    setShowEventConfig(false);
  };

  const handleUpdateWeek = (weekIndex: number, updatedWeek: TrainingWeek) => {
    if (!plan) return;

    const updatedWeeks = [...plan.weeks];
    updatedWeeks[weekIndex] = {
      ...updatedWeek,
      totalKm: calculateWeeklyKm(updatedWeek.sessions),
    };

    setPlan({
      ...plan,
      weeks: updatedWeeks,
    });
  };

  const handleExportPDF = async () => {
    if (plan) {
      await exportToPDF(plan);
    }
  };

  const handleEditEvent = () => {
    setShowEventConfig(true);
  };

  const handleExportJSON = () => {
    if (plan) {
      exportToJSON(plan);
      toast.success('Plan als JSON exportiert');
    }
  };

  const handleExportFIT = () => {
    if (plan) {
      exportToFIT(plan);
      toast.success('Plan als FIT exportiert');
    }
  };

  const handleExportICal = () => {
    if (plan) {
      exportToICal(plan);
      toast.success('Plan als iCal exportiert');
    }
  };

  const handleShowSubscription = () => {
    if (isNewPlan) {
      toast.error('Bitte speichern Sie den Plan zuerst, um ein Kalender-Abonnement zu erstellen');
      return;
    }
    setShowSubscriptionModal(true);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        let importedPlan: TrainingPlan;

        // Auto-detect file type based on extension
        if (file.name.endsWith('.fit')) {
          importedPlan = await importFromFIT(file);
          toast.success('FIT-Datei erfolgreich importiert');
        } else if (file.name.endsWith('.json')) {
          importedPlan = await importFromJSON(file);
          toast.success('JSON-Datei erfolgreich importiert');
        } else {
          // Try to detect by content
          const text = await file.text();
          if (text.trim().startsWith('{')) {
            // Likely JSON
            importedPlan = JSON.parse(text);
            toast.success('JSON-Datei erfolgreich importiert');
          } else {
            // Try FIT
            importedPlan = await importFromFIT(file);
            toast.success('FIT-Datei erfolgreich importiert');
          }
        }

        // If we're on a new plan, create it in the database immediately
        if (isNewPlan) {
          setSaving(true);
          try {
            const saved = await trainingPlanService.createPlan(importedPlan);
            // Navigate to edit mode with the new ID
            navigate(`/plan/${saved.id}`, { replace: true });
          } catch (err) {
            console.error(err);
            toast.error('Fehler beim Speichern des importierten Plans');
          } finally {
            setSaving(false);
          }
        } else {
          // If editing an existing plan, just update the state
          setPlan(importedPlan);
          setShowEventConfig(false);
        }
      } catch (error) {
        toast.error((error as Error).message);
      }
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={flex.row}>
          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
          <span className={cn(typography.body, 'text-text-tertiary')}>
            Lade Trainingsplan...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.fit"
          onChange={handleFileChange}
          className="hidden"
        />

        {showEventConfig ? (
          <div className="container mx-auto px-3 sm:px-4 py-6 max-w-7xl">
            {/* Action Bar for EventConfig */}
            <div className="mb-6 flex justify-between items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft size={18} />
                Zurück
              </Button>
              {!plan && (
                <Button
                  onClick={handleImport}
                  variant="secondary"
                >
                  <Upload size={18} />
                  Plan laden
                </Button>
              )}
            </div>
            <EventConfig
              onSubmit={handleEventSubmit}
              initialData={plan?.event}
              initialStartDate={plan?.startDate}
            />
          </div>
        ) : (
          <>
            {plan && (
              <>
                {/* Compact Sticky Header */}
                <CompactPlanHeader
                  plan={plan}
                  savedPlan={savedPlan}
                  saving={saving}
                  lastSaved={lastSaved}
                  runnerProfile={runnerProfile}
                  onBack={() => navigate('/dashboard')}
                  onPublish={() => setShowPublishModal(true)}
                  onEditEvent={handleEditEvent}
                  onExportJSON={handleExportJSON}
                  onExportFIT={handleExportFIT}
                  onExportICal={handleExportICal}
                  onExportPDF={handleExportPDF}
                  onShowSubscription={handleShowSubscription}
                />

                {/* Main Content */}
                <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
                  {/* Weekly Chart - Hero Element */}
                  <WeeklyChart weeks={plan.weeks} userProfile={runnerProfile || undefined} />

                  {/* Weekly Plans */}
                  <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    {plan.weeks.map((week, index) => (
                      <WeeklyPlan
                        key={week.weekNumber}
                        week={week}
                        weekIndex={index}
                        onUpdate={(updatedWeek) =>
                          handleUpdateWeek(index, updatedWeek)
                        }
                        plan={plan}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Publish Modal */}
        {showPublishModal && savedPlan && id && (
          <PublishPlanModal
            planId={id}
            currentVisibility={savedPlan.visibility}
            currentDescription={savedPlan.description}
            currentTags={savedPlan.tags}
            onClose={() => setShowPublishModal(false)}
            onSuccess={async () => {
              setShowPublishModal(false);
              toast.success(
                savedPlan.visibility === 'private'
                  ? 'Plan erfolgreich veröffentlicht!'
                  : 'Plan-Veröffentlichung aktualisiert!'
              );
              // Reload plan to get updated visibility
              await loadPlan(id);
            }}
          />
        )}

      {/* iCal Subscription Modal */}
      {id && !isNewPlan && plan && (
        <ICalSubscriptionModal
          planId={id}
          planName={plan.event.name}
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      )}
      </div>
  );
}
