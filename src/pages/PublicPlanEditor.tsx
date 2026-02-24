/**
 * PublicPlanEditor — Öffentlicher Trainingsplan-Editor ohne Anmeldung
 *
 * Nutzt localStorage für Persistenz. Alle Exports (PDF, JSON) funktionieren
 * ohne Login. Zum Speichern in der Cloud / Veröffentlichen ist ein Account nötig.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrainingPlan, TrainingWeek, RaceEvent, TrainingSession } from '../types';
import { calculateWeeks } from '../utils/dateUtils';
import { calculateWeeklyKm, getRaceDistanceKm } from '../utils/calculationUtils';
import EventConfigLayout from '../components/EventConfigLayout';
import WeeklyPlan from '../components/WeeklyPlan';
import WeeklyChart from '../components/WeeklyChart';
import { GuestEditorBanner } from '../components/GuestEditorBanner';
import { exportToPDF } from '../utils/pdfExport';
import { exportToJSON, importFromJSON } from '../utils/jsonExportImport';
import { useToast } from '../contexts/ToastContext';
import { analytics } from '../utils/analytics';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  FileDown,
  Pencil,
  MoreHorizontal,
  Save,
  Share2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const GUEST_PLAN_KEY = 'tp_guest_plan';

function loadGuestPlan(): TrainingPlan | null {
  try {
    const raw = localStorage.getItem(GUEST_PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrainingPlan;
  } catch {
    return null;
  }
}

function saveGuestPlan(plan: TrainingPlan) {
  try {
    localStorage.setItem(GUEST_PLAN_KEY, JSON.stringify(plan));
  } catch {
    // Ignore storage errors
  }
}

export default function PublicPlanEditor() {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedPlan = loadGuestPlan();
  const [plan, setPlan] = useState<TrainingPlan | null>(savedPlan);
  const [showEventConfig, setShowEventConfig] = useState(!savedPlan);
  const [lastSaved, setLastSaved] = useState<Date | null>(savedPlan ? new Date() : null);

  // Track guest editor open once on mount
  useEffect(() => {
    analytics.trackGuestEditorOpened();
  }, []);

  // Debounced localStorage auto-save
  useEffect(() => {
    if (!plan) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveGuestPlan(plan);
      setLastSaved(new Date());
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [plan]);

  const handleEventSubmit = (event: RaceEvent, startDate: string) => {
    const weekData = calculateWeeks(startDate, event.date);

    const existingSessions =
      plan?.weeks.flatMap((w) => w.sessions.filter((s) => s.type !== 'race')) || [];

    const weeks: TrainingWeek[] = weekData.map((week, index) => {
      const matchingSessions = existingSessions.filter((session) => {
        const oldWeek = plan?.weeks.find((w) => w.sessions.some((s) => s.id === session.id));
        if (!oldWeek) return false;
        return oldWeek.weekNumber === week.weekNumber;
      });

      const sessions: TrainingSession[] = [...matchingSessions];

      if (index === weekData.length - 1) {
        const eventDate = new Date(event.date);
        const eventDayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;

        const raceDistance =
          event.distance === 'CUSTOM'
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

    analytics.trackGuestPlanCreated(event.distance);
    setPlan({ event, startDate, weeks });
    setShowEventConfig(false);
  };

  const handleUpdateWeek = (weekIndex: number, updatedWeek: TrainingWeek) => {
    if (!plan) return;
    const updatedWeeks = [...plan.weeks];
    updatedWeeks[weekIndex] = {
      ...updatedWeek,
      totalKm: calculateWeeklyKm(updatedWeek.sessions),
    };
    setPlan({ ...plan, weeks: updatedWeeks });
  };

  const handleExportPDF = async () => {
    if (plan) {
      await exportToPDF(plan);
      analytics.trackGuestPlanExported('pdf');
    }
  };

  const handleExportJSON = () => {
    if (plan) {
      exportToJSON(plan);
      analytics.trackGuestPlanExported('json');
      toast.success('Plan als JSON exportiert');
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedPlan: TrainingPlan = await importFromJSON(file);
        setPlan(importedPlan);
        setShowEventConfig(false);
        toast.success('JSON-Datei erfolgreich importiert');
      } catch (error) {
        toast.error((error as Error).message);
      }
      event.target.value = '';
    }
  };

  const handleNewPlan = () => {
    if (plan && !confirm('Neuen Plan beginnen? Dein aktueller Plan wird überschrieben.')) return;
    setPlan(null);
    localStorage.removeItem(GUEST_PLAN_KEY);
    setShowEventConfig(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Guest mode banner */}
      <GuestEditorBanner />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {showEventConfig ? (
        <div>
          {/* Simple back nav */}
          <div className="border-b border-slate-100 bg-white/80 backdrop-blur-sm px-4 py-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Zurück zur Startseite
            </button>
          </div>
          <EventConfigLayout
            onSubmit={handleEventSubmit}
            onBack={() => (plan ? setShowEventConfig(false) : navigate('/'))}
            onImport={handleImport}
            initialData={plan?.event}
            initialStartDate={plan?.startDate}
            showImportButton={!plan}
          />
        </div>
      ) : (
        plan && (
          <>
            {/* Compact public header */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
              <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Left: Back + Plan name */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => navigate('/')}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex-shrink-0"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="min-w-0">
                    <h1 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                      {plan.event.name}
                    </h1>
                    <p className="text-xs text-slate-500">
                      {plan.weeks.length} Wochen · {plan.event.distance}
                      {lastSaved && (
                        <span className="ml-2 text-green-600">
                          <Save size={10} className="inline mb-0.5" /> Lokal gespeichert
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Login CTA */}
                  <Link
                    to="/login"
                    onClick={() => analytics.trackGuestSignupCTAClicked('header')}
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Share2 size={13} />
                    Veröffentlichen
                  </Link>

                  {/* Export menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                        <Download size={13} />
                        Export
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleExportPDF}>
                        <FileDown size={14} className="mr-2" />
                        Als PDF exportieren
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportJSON}>
                        <FileDown size={14} className="mr-2" />
                        Als JSON exportieren
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* More options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setShowEventConfig(true)}>
                        <Pencil size={14} className="mr-2" />
                        Wettkampf bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleImport}>
                        <FileDown size={14} className="mr-2" />
                        JSON importieren
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleNewPlan} className="text-red-600">
                        Neuen Plan beginnen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Main editor content */}
            <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
              <WeeklyChart weeks={plan.weeks} />

              <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                {plan.weeks.map((week, index) => (
                  <WeeklyPlan
                    key={week.weekNumber}
                    week={week}
                    weekIndex={index}
                    onUpdate={(updatedWeek) => handleUpdateWeek(index, updatedWeek)}
                    plan={plan}
                  />
                ))}
              </div>

              {/* Bottom CTA for registration */}
              <div className="mt-12 mb-8 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 p-8 text-white text-center">
                <p className="text-sm text-white/60 mb-2">Bereit, deinen Plan zu teilen?</p>
                <h3 className="text-xl font-bold mb-4">
                  Kostenlos registrieren & Plan veröffentlichen
                </h3>
                <p className="text-sm text-white/70 mb-6 max-w-md mx-auto">
                  Mit einem kostenlosen Account kannst du Pläne in der Cloud speichern,
                  im Marktplatz veröffentlichen und iCal-Sync nutzen.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    to="/login"
                    onClick={() => analytics.trackGuestSignupCTAClicked('bottom_cta')}
                    className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                  >
                    Kostenlos registrieren
                  </Link>
                  <button
                    onClick={handleExportJSON}
                    className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <FileDown size={16} />
                    Plan als JSON speichern
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
