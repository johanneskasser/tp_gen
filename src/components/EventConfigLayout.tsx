import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RaceEvent, RaceDistance, TrainingPlan, TrainingWeek, TrainingSession } from '../types';
import EventConfig from './EventConfig';
import MarketplaceSuggestions from './marketplace/MarketplaceSuggestions';
import { MarketplacePlan } from '../types/marketplace';
import { useMarketplaceSearch } from '../hooks/useMarketplaceSearch';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { marketplaceService } from '../services/marketplaceService';
import { GUEST_PLAN_KEY } from '../hooks/useGuestPlanMigration';
import { calculateWeeks } from '../utils/dateUtils';
import { calculateWeeklyKm, getRaceDistanceKm } from '../utils/calculationUtils';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from './ui';
import { cn } from '../lib/designSystem';

interface EventConfigLayoutProps {
  onSubmit: (event: RaceEvent, startDate: string) => void;
  onBack: () => void;
  onImport: () => void;
  initialData?: RaceEvent;
  initialStartDate?: string;
  showImportButton?: boolean;
}

// ── Date helpers ────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Compute sensible start/event dates for the cloned plan.
 * - If the original event date is in the future, keep both dates as-is.
 * - Otherwise, offset forward so training starts one week from today
 *   and the event date is today + plan duration.
 */
function buildCloneDates(plan: MarketplacePlan): { startDate: string; eventDate: string } {
  const originalEventDate = new Date(plan.plan_data.event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (originalEventDate > today) {
    return {
      startDate: plan.plan_data.startDate,
      eventDate: plan.plan_data.event.date,
    };
  }

  // Dates are in the past — shift to today + plan duration
  const weeksCount = plan.plan_data.weeks?.length ?? 12;
  const newStart = new Date(today);
  newStart.setDate(today.getDate() + 7); // start next week

  const newEnd = new Date(newStart);
  newEnd.setDate(newStart.getDate() + weeksCount * 7);

  return { startDate: toDateStr(newStart), eventDate: toDateStr(newEnd) };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EventConfigLayout({
  onSubmit,
  onBack,
  onImport,
  initialData,
  initialStartDate,
  showImportButton = true,
}: EventConfigLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [isVisible, setIsVisible] = useState(false);

  // ── Search state (fed by EventConfig's onSearchParamsChange) ─────────────
  const [searchDistance, setSearchDistance] = useState<RaceDistance | null>(
    initialData?.distance ?? null
  );
  const [searchTargetTime, setSearchTargetTime] = useState(
    initialData?.targetTime ?? ''
  );
  const [searchStartDate, setSearchStartDate] = useState<Date | null>(
    initialStartDate ? new Date(initialStartDate) : null
  );
  const [searchEventDate, setSearchEventDate] = useState<Date | null>(
    initialData?.date ? new Date(initialData.date) : null
  );

  // Duration in weeks derived from the picked dates — drives marketplace sort
  const durationWeeks = useMemo<number | null>(() => {
    if (!searchStartDate || !searchEventDate) return null;
    const diff = searchEventDate.getTime() - searchStartDate.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
  }, [searchStartDate, searchEventDate]);

  // ── Selected plan for cloning ─────────────────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<MarketplacePlan | null>(null);
  const [cloningLoading, setCloningLoading] = useState(false);

  // Key forces EventConfig to remount (resetting its internal state) when a
  // different plan is selected for pre-filling.
  const formKey = selectedPlan?.id ?? 'default';

  // Build EventConfig initialData from the selected plan
  const formInitialData = useMemo<RaceEvent | undefined>(() => {
    if (!selectedPlan) return initialData;
    const { event } = selectedPlan.plan_data;
    const dates = buildCloneDates(selectedPlan);
    return {
      name: selectedPlan.name,
      date: dates.eventDate,
      distance: event.distance,
      customDistance: event.customDistance,
      terrain: event.terrain,
      elevationGain: event.elevationGain,
      targetTime: event.targetTime,
    };
  }, [selectedPlan, initialData]);

  const formInitialStartDate = useMemo<string | undefined>(() => {
    if (!selectedPlan) return initialStartDate;
    return buildCloneDates(selectedPlan).startDate;
  }, [selectedPlan, initialStartDate]);

  // ── Marketplace search ────────────────────────────────────────────────────
  const { plans, loading, error } = useMarketplaceSearch(
    searchDistance,
    searchTargetTime,
    durationWeeks
  );

  const showSuggestions = searchDistance !== null && searchDistance !== 'CUSTOM';

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleSearchParamsChange = useCallback(
    (
      distance: RaceDistance,
      targetTime: string,
      startDate: Date | null,
      eventDate: Date | null
    ) => {
      setSearchDistance(distance);
      setSearchTargetTime(targetTime);
      setSearchStartDate(startDate);
      setSearchEventDate(eventDate);
    },
    []
  );

  const handleSelectForClone = useCallback((plan: MarketplacePlan) => {
    setSelectedPlan(plan);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedPlan(null);
  }, []);

  /**
   * Clone action: rebuild the plan's sessions into new week boundaries based
   * on the user's adjusted dates, then persist via clonePlan.
   */
  const handleCloneSubmit = useCallback(
    async (event: RaceEvent, startDateStr: string) => {
      if (!selectedPlan) return;

      setCloningLoading(true);
      try {
        const weekData = calculateWeeks(startDateStr, event.date);
        const originalWeeks = selectedPlan.plan_data.weeks ?? [];

        // When the user's duration is shorter than the original plan, drop the
        // earliest weeks (build-up phase) and keep the final weeks (peak + taper)
        // so the race-specific preparation is preserved.
        const droppedWeeks = Math.max(0, originalWeeks.length - weekData.length);
        const offset = droppedWeeks; // originalWeeks[offset + i] aligns to weekData[i]

        const weeks: TrainingWeek[] = weekData.map((week, index) => {
          // Carry over sessions from the same-index original week (drop race sessions —
          // we'll add a fresh one anchored to the new event date)
          const originalSessions: TrainingSession[] = (
            originalWeeks[offset + index]?.sessions ?? []
          ).filter((s) => s.type !== 'race');

          const sessions: TrainingSession[] = [...originalSessions];

          // Add race session to the last week on the new event date
          if (index === weekData.length - 1) {
            const eventDateObj = new Date(event.date);
            const dayOfWeek =
              eventDateObj.getDay() === 0 ? 6 : eventDateObj.getDay() - 1;

            const raceDistance =
              event.distance === 'CUSTOM'
                ? event.customDistance ?? 0
                : getRaceDistanceKm(event.distance);

            sessions.push({
              id: `race-${Date.now()}`,
              dayOfWeek,
              type: 'race' as const,
              title: event.name,
              distance: raceDistance,
              notes: event.targetTime
                ? `Zielzeit: ${event.targetTime}`
                : undefined,
            });
          }

          return {
            ...week,
            sessions,
            totalKm: calculateWeeklyKm(sessions),
          };
        });

        const newPlan: TrainingPlan = { event, startDate: startDateStr, weeks };

        if (!user) {
          // Guest path: save to localStorage so the plan is available in /editor
          const existingPlan = localStorage.getItem(GUEST_PLAN_KEY);
          if (existingPlan) {
            const confirmed = window.confirm(
              'Du hast bereits einen Gast-Plan. Soll er durch den kopierten Plan ersetzt werden?'
            );
            if (!confirmed) {
              setCloningLoading(false);
              return;
            }
          }
          try {
            localStorage.setItem(GUEST_PLAN_KEY, JSON.stringify(newPlan));
          } catch {
            toast.error('Der Plan konnte nicht lokal gespeichert werden. Möglicherweise ist der Speicher voll.');
            setCloningLoading(false);
            return;
          }
          await marketplaceService.incrementCloneCount(selectedPlan.id);
          toast.success('Plan kopiert! Du kannst ihn jetzt bearbeiten.');
          window.location.href = '/editor';
        } else {
          const newPlanId = await marketplaceService.clonePlan(
            selectedPlan.id,
            newPlan
          );
          if (droppedWeeks > 0) {
            toast.success(
              `Plan geklont! Die ersten ${droppedWeeks} Aufbau-${droppedWeeks === 1 ? 'Woche wurde' : 'Wochen wurden'} gekürzt — der Plan startet jetzt direkt mit der intensiveren Phase.`
            );
          } else {
            toast.success('Plan geklont! Du kannst ihn jetzt bearbeiten.');
          }
          navigate(`/plan/${newPlanId}`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Klonen fehlgeschlagen – bitte erneut versuchen');
      } finally {
        setCloningLoading(false);
      }
    },
    [selectedPlan, user, navigate, toast]
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-72px)]">
      <div
        className={cn(
          'container mx-auto px-4 sm:px-6 py-6 sm:py-10 transition-all duration-300',
          showSuggestions ? 'max-w-5xl' : 'max-w-2xl'
        )}
      >
        {/* Top bar */}
        <div
          className={cn(
            'flex items-center justify-between mb-6 transition-all duration-300',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          )}
        >
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft size={18} />
            Zurück
          </Button>

          {showImportButton && (
            <Button onClick={onImport} variant="secondary" size="sm">
              <Upload size={16} />
              <span className="hidden sm:inline">Importieren</span>
            </Button>
          )}
        </div>

        {/* Two-column grid: form + suggestions */}
        <div
          className={cn(
            'transition-all duration-300',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
            showSuggestions
              ? 'grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start'
              : 'block'
          )}
          style={{ transitionDelay: '80ms' }}
        >
          {/* Form card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-8">
              <EventConfig
                key={formKey}
                onSubmit={onSubmit}
                onClone={selectedPlan ? handleCloneSubmit : undefined}
                onDeselect={selectedPlan ? handleDeselect : undefined}
                isCloneLoading={cloningLoading}
                initialData={formInitialData}
                initialStartDate={formInitialStartDate}
                onSearchParamsChange={handleSearchParamsChange}
              />
            </div>
          </div>

          {/* Suggestions panel */}
          {showSuggestions && (
            <div className="lg:sticky lg:top-6">
              <MarketplaceSuggestions
                plans={plans}
                loading={loading}
                error={error}
                distance={searchDistance}
                selectedPlanId={selectedPlan?.id}
                userDurationWeeks={durationWeeks}
                onSelectForClone={handleSelectForClone}
                onDeselect={handleDeselect}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
