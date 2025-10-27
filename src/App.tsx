import { useState, useRef } from 'react';
import { TrainingPlan, TrainingWeek, RaceEvent } from './types';
import { calculateWeeks } from './utils/dateUtils';
import { calculateWeeklyKm, getRaceDistanceKm } from './utils/calculationUtils';
import EventConfig from './components/EventConfig';
import WeeklyPlan from './components/WeeklyPlan';
import WeeklyChart from './components/WeeklyChart';
import { FileDown, Download, Upload } from 'lucide-react';
import { exportToPDF } from './utils/pdfExport';
import { calculatePace, formatPace } from './utils/paceCalculator';
import { exportToJSON, importFromJSON } from './utils/jsonExportImport';

function App() {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [showEventConfig, setShowEventConfig] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEventSubmit = (event: RaceEvent, startDate: string) => {
    const weekData = calculateWeeks(startDate, event.date);

    const weeks: TrainingWeek[] = weekData.map((week, index) => {
      const sessions = [];

      // Add race session to the last week on the event date
      if (index === weekData.length - 1) {
        const eventDate = new Date(event.date);
        const eventDayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1; // Convert to ISO day (0 = Monday)

        const raceDistance = event.distance === 'CUSTOM'
          ? event.customDistance || 0
          : getRaceDistanceKm(event.distance);

        sessions.push({
          id: `race-${Date.now()}`,
          dayOfWeek: eventDayOfWeek,
          type: 'race',
          title: event.name,
          distance: raceDistance,
          notes: event.targetTime ? `Zielzeit: ${event.targetTime}` : undefined,
        });
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
        setPlan(importedPlan);
        setShowEventConfig(false);
      } catch (error) {
        alert((error as Error).message);
      }
      // Reset input so same file can be selected again
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Trainingsplan Generator
              </h1>
              <p className="text-slate-600">
                Erstelle deinen individuellen Lauftrainingsplan
              </p>
            </div>
            {showEventConfig && (
              <button
                onClick={handleImportJSON}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
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
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">
                        {plan.event.name}
                      </h2>
                      <p className="text-slate-600">
                        {plan.event.distance}
                        {plan.event.distance === 'CUSTOM' &&
                          ` (${plan.event.customDistance} km)`}{' '}
                        - {plan.event.terrain === 'road' ? 'Straße' : 'Trail'}
                        {plan.event.terrain === 'trail' &&
                          plan.event.elevationGain &&
                          ` - ${plan.event.elevationGain} HM`}
                      </p>
                      {plan.event.targetTime && (
                        <p className="text-sm text-slate-600 mt-1">
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
                      <p className="text-sm text-slate-500 mt-1">
                        {plan.weeks.length} Wochen Training
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditEvent}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Event bearbeiten
                      </button>
                      <button
                        onClick={handleExportJSON}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Download size={20} />
                        Plan speichern
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <FileDown size={20} />
                        PDF exportieren
                      </button>
                    </div>
                  </div>
                </div>

                <WeeklyChart weeks={plan.weeks} />

                <div className="mt-8 space-y-6">
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
    </div>
  );
}

export default App;
