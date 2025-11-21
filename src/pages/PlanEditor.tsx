import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TrainingPlan, TrainingWeek, RaceEvent } from '../types';
import { calculateWeeks } from '../utils/dateUtils';
import { calculateWeeklyKm, getRaceDistanceKm } from '../utils/calculationUtils';
import EventConfig from '../components/EventConfig';
import WeeklyPlan from '../components/WeeklyPlan';
import WeeklyChart from '../components/WeeklyChart';
import PublishPlanModal from '../components/PublishPlanModal';
import { FileDown, Download, Upload, ArrowLeft, Save, Loader2, Share2 } from 'lucide-react';
import { exportToPDF } from '../utils/pdfExport';
import { calculatePace, formatPace } from '../utils/paceCalculator';
import { exportToJSON, importFromJSON } from '../utils/jsonExportImport';
import { trainingPlanService, SavedTrainingPlan } from '../services/trainingPlanService';
import { TrainingSession } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button, Card } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { useToast } from '../contexts/ToastContext';

export default function PlanEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isNewPlan = id === 'new';

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedTrainingPlan | null>(null);
  const [showEventConfig, setShowEventConfig] = useState(isNewPlan);
  const [loading, setLoading] = useState(!isNewPlan);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [, setCurrentTime] = useState(new Date());
  const [showPublishModal, setShowPublishModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing plan
  useEffect(() => {
    if (!isNewPlan && id) {
      loadPlan(id);
    }
  }, [id, isNewPlan]);

  // Auto-save effect (debounced)
  useEffect(() => {
    if (!plan || isNewPlan) return;

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

  // Update relative time display every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getRelativeSaveTime = () => {
    if (!lastSaved) return '';

    const secondsAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000);

    if (secondsAgo < 10) {
      return 'Gespeichert gerade jetzt';
    }

    return `Gespeichert ${formatDistanceToNow(lastSaved, {
      addSuffix: true,
      locale: de
    })}`;
  };

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
        // Navigate to edit mode with the new ID
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
    }
  };

  const handleImportJSON = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedPlan = await importFromJSON(file);

        // If we're on a new plan, create it in the database immediately
        if (isNewPlan) {
          setSaving(true);
          try {
            const saved = await trainingPlanService.createPlan(importedPlan);
            // Navigate to edit mode with the new ID
            navigate(`/plan/${saved.id}`, { replace: true });
          } catch (err) {
            console.error(err);
            alert('Fehler beim Speichern des importierten Plans');
          } finally {
            setSaving(false);
          }
        } else {
          // If editing an existing plan, just update the state
          setPlan(importedPlan);
          setShowEventConfig(false);
        }
      } catch (error) {
        alert((error as Error).message);
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
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        {/* Action Bar */}
        <div className="mb-6 sm:mb-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={18} />}
            >
              Zurück
            </Button>
            {!isNewPlan && lastSaved && (
              <p className={cn(typography.small, 'text-text-tertiary')}>
                {saving ? (
                  <span className="flex items-center gap-1">
                    <Save size={14} className="animate-pulse" />
                    Speichert...
                  </span>
                ) : (
                  getRelativeSaveTime()
                )}
              </p>
            )}
          </div>
          {showEventConfig && !plan && (
            <Button
              onClick={handleImportJSON}
              variant="secondary"
              leftIcon={<Upload size={18} />}
            >
              Plan laden
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {showEventConfig ? (
          <EventConfig
            onSubmit={handleEventSubmit}
            initialData={plan?.event}
            initialStartDate={plan?.startDate}
          />
        ) : (
          <>
            {plan && (
              <>
                {/* Event Summary Card */}
                <Card variant="default" className="mb-4 sm:mb-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div className="flex-1">
                      <h2 className={cn(typography.h2, 'mb-2')}>
                        {plan.event.name}
                      </h2>
                      <p className={cn(typography.body, 'text-text-secondary mb-1')}>
                        {plan.event.distance}
                        {plan.event.distance === 'CUSTOM' &&
                          ` (${plan.event.customDistance} km)`}{' '}
                        - {plan.event.terrain === 'road' ? 'Straße' : 'Trail'}
                        {plan.event.terrain === 'trail' &&
                          plan.event.elevationGain &&
                          ` - ${plan.event.elevationGain} HM`}
                      </p>
                      {plan.event.targetTime && (
                        <p className={cn(typography.bodySmall, 'text-text-secondary')}>
                          <strong>Zielzeit:</strong> {plan.event.targetTime} |{' '}
                          <strong>Pace:</strong>{' '}
                          {formatPace(
                            calculatePace(
                              plan.event.targetTime,
                              getRaceDistanceKm(
                                plan.event.distance,
                                plan.event.customDistance
                              )
                            )
                          )}
                        </p>
                      )}
                      <p className={cn(typography.bodySmall, 'text-text-tertiary mt-1')}>
                        {plan.weeks.length} Wochen Training
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                      {!isNewPlan && (
                        <Button
                          onClick={() => setShowPublishModal(true)}
                          variant={savedPlan?.visibility !== 'private' ? 'primary' : 'secondary'}
                          leftIcon={<Share2 size={18} />}
                          size="sm"
                        >
                          <span className="whitespace-nowrap">
                            {savedPlan?.visibility !== 'private' ? 'Veröffentlicht' : 'Veröffentlichen'}
                          </span>
                        </Button>
                      )}
                      <Button
                        onClick={handleEditEvent}
                        variant="secondary"
                        size="sm"
                      >
                        Event bearbeiten
                      </Button>
                      <Button
                        onClick={handleExportJSON}
                        variant="secondary"
                        leftIcon={<Download size={18} />}
                        size="sm"
                      >
                        <span className="whitespace-nowrap">JSON Export</span>
                      </Button>
                      <Button
                        onClick={handleExportPDF}
                        leftIcon={<FileDown size={18} />}
                        size="sm"
                      >
                        <span className="whitespace-nowrap">PDF exportieren</span>
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Weekly Chart */}
                <WeeklyChart weeks={plan.weeks} />

                {/* Weekly Plans */}
                <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
                  {plan.weeks.map((week, index) => (
                    <WeeklyPlan
                      key={week.weekNumber}
                      week={week}
                      weekIndex={index}
                      onUpdate={(updatedWeek) =>
                        handleUpdateWeek(index, updatedWeek)
                      }
                    />
                  ))}
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
      </div>
  );
}
