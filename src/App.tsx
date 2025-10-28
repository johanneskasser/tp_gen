import { useState, useRef, useEffect } from 'react';
import { TrainingPlan, TrainingWeek, RaceEvent, TrainingSession } from './types';
import { calculateWeeks } from './utils/dateUtils';
import { calculateWeeklyKm, getRaceDistanceKm } from './utils/calculationUtils';
import EventConfig from './components/EventConfig';
import WeeklyPlan from './components/WeeklyPlan';
import WeeklyChart from './components/WeeklyChart';
import { FileDown, Download, Upload } from 'lucide-react';
import { exportToPDF } from './utils/pdfExport';
import { calculatePace, formatPace } from './utils/paceCalculator';
import { exportToJSON, importFromJSON } from './utils/jsonExportImport';
import { Analytics } from "@vercel/analytics/react"

function App() {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [showEventConfig, setShowEventConfig] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeUnloadCallbackRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  // Set up beforeunload event listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    beforeUnloadCallbackRef.current = handleBeforeUnload;
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (beforeUnloadCallbackRef.current) {
        window.removeEventListener('beforeunload', beforeUnloadCallbackRef.current);
      }
    };
  }, [hasUnsavedChanges]);

  const handleEventSubmit = (event: RaceEvent, startDate: string) => {
    const weekData = calculateWeeks(startDate, event.date);

    // If we're editing an existing plan, try to preserve existing sessions
    const existingSessions = plan?.weeks.flatMap(w => w.sessions.filter(s => s.type !== 'race')) || [];

    const weeks: TrainingWeek[] = weekData.map((week, index) => {
      // Try to find existing sessions that match this week's date range
      const matchingSessions = existingSessions.filter(session => {
        // Find which week this session belonged to in the old plan
        const oldWeek = plan?.weeks.find(w =>
          w.sessions.some(s => s.id === session.id)
        );

        if (!oldWeek) return false;

        // Check if the old week's number matches the new week's number
        // This preserves sessions when the structure is similar
        return oldWeek.weekNumber === week.weekNumber;
      });

      const sessions: TrainingSession[] = [...matchingSessions];

      // Add race session to the last week on the event date
      if (index === weekData.length - 1) {
        const eventDate = new Date(event.date);
        const eventDayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1; // Convert to ISO day (0 = Monday)

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
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(false);
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
        setPlan(importedPlan);
        setShowEventConfig(false);
        setHasUnsavedChanges(false);
      } catch (error) {
        alert((error as Error).message);
      }
      // Reset input so same file can be selected again
      event.target.value = '';
    }
  };

  const handleSaveAndContinue = () => {
    handleExportJSON();
    setShowUnsavedDialog(false);
  };

  const handleDontSave = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
  };

  const handleCancelClose = () => {
    setShowUnsavedDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                Trainingsplan Generator
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Erstelle deinen individuellen Lauftrainingsplan
              </p>
            </div>
            {showEventConfig && (
              <button
                onClick={handleImportJSON}
                className="w-full sm:w-auto px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Plan laden
              </button>
            )}
          </div>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Unsaved Changes Dialog */}
        {showUnsavedDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4">
                Unsaved changes will be lost
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">
                Du hast ungespeicherte Änderungen. Möchtest du diese speichern, bevor du fortfährst?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  onClick={handleCancelClose}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm sm:text-base"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDontSave}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  Nicht speichern
                </button>
                <button
                  onClick={handleSaveAndContinue}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

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
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                        {plan.event.name}
                      </h2>
                      <p className="text-sm sm:text-base text-slate-600">
                        {plan.event.distance}
                        {plan.event.distance === 'CUSTOM' &&
                          ` (${plan.event.customDistance} km)`}{' '}
                        - {plan.event.terrain === 'road' ? 'Straße' : 'Trail'}
                        {plan.event.terrain === 'trail' &&
                          plan.event.elevationGain &&
                          ` - ${plan.event.elevationGain} HM`}
                      </p>
                      {plan.event.targetTime && (
                        <p className="text-xs sm:text-sm text-slate-600 mt-1">
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
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {plan.weeks.length} Wochen Training
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                      <button
                        onClick={handleEditEvent}
                        className="px-3 sm:px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm sm:text-base whitespace-nowrap"
                      >
                        Event bearbeiten
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Download size={18} className="sm:w-5 sm:h-5" />
                        <span className="whitespace-nowrap">Plan speichern</span>
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <FileDown size={18} className="sm:w-5 sm:h-5" />
                        <span className="whitespace-nowrap">PDF exportieren</span>
                      </button>
                    </div>
                  </div>
                </div>

                <WeeklyChart weeks={plan.weeks} />

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
      </div>
      <Analytics />
    </div>
  );
}

export default App;
