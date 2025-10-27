import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { de } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker-custom.css';
import { RaceEvent, RaceDistance, TerrainType } from '../types';
import { Calendar, Mountain, MapPin, Timer } from 'lucide-react';
import { calculatePace, formatPace } from '../utils/paceCalculator';
import { getRaceDistanceKm } from '../utils/calculationUtils';

// Register German locale for DatePicker
registerLocale('de', de);

interface EventConfigProps {
  onSubmit: (event: RaceEvent, startDate: string) => void;
  initialData?: RaceEvent;
  initialStartDate?: string;
}

export default function EventConfig({
  onSubmit,
  initialData,
  initialStartDate,
}: EventConfigProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [eventDate, setEventDate] = useState<Date | null>(
    initialData?.date ? new Date(initialData.date) : null
  );
  const [startDate, setStartDate] = useState<Date | null>(
    initialStartDate ? new Date(initialStartDate) : null
  );
  const [distance, setDistance] = useState<RaceDistance>(
    initialData?.distance || '10K'
  );
  const [customDistance, setCustomDistance] = useState(
    initialData?.customDistance?.toString() || ''
  );
  const [terrain, setTerrain] = useState<TerrainType>(
    initialData?.terrain || 'road'
  );
  const [elevationGain, setElevationGain] = useState(
    initialData?.elevationGain?.toString() || ''
  );
  const [targetTime, setTargetTime] = useState(initialData?.targetTime || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventDate || !startDate) return;

    // Convert dates to YYYY-MM-DD format
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const event: RaceEvent = {
      name,
      date: formatDate(eventDate),
      distance,
      customDistance: distance === 'CUSTOM' ? parseFloat(customDistance) : undefined,
      terrain,
      elevationGain: terrain === 'trail' && elevationGain ? parseInt(elevationGain) : undefined,
      targetTime: targetTime || undefined,
    };

    onSubmit(event, formatDate(startDate));
  };

  // Calculate pace when targetTime or distance changes
  const calculatedPace = (() => {
    if (!targetTime) return '';
    const distKm = distance === 'CUSTOM' && customDistance
      ? parseFloat(customDistance)
      : getRaceDistanceKm(distance);

    return calculatePace(targetTime, distKm);
  })();

  // Calculate training duration and days until start
  const trainingInfo = (() => {
    if (!startDate || !eventDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(eventDate);
    end.setHours(0, 0, 0, 0);

    // Calculate days between dates
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;

    // Calculate days until training start
    const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalDays,
      weeks,
      remainingDays,
      daysUntilStart,
    };
  })();

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calendar className="text-blue-600" />
        Event Konfiguration
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Event Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. Berlin Marathon 2024"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Startdatum Training
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              locale="de"
              dateFormat="dd.MM.yyyy"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholderText="Datum wählen"
              required
              calendarStartDay={1}
            />
            <p className="text-xs text-slate-500 mt-1">
              Woche startet am gewählten Wochentag
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Event Datum
            </label>
            <DatePicker
              selected={eventDate}
              onChange={(date: Date | null) => setEventDate(date)}
              locale="de"
              dateFormat="dd.MM.yyyy"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholderText="Datum wählen"
              required
              calendarStartDay={1}
              minDate={startDate || undefined}
            />
          </div>
        </div>

        {trainingInfo && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {trainingInfo.weeks}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {trainingInfo.weeks === 1 ? 'Woche' : 'Wochen'}
                </div>
                {trainingInfo.remainingDays > 0 && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    + {trainingInfo.remainingDays} {trainingInfo.remainingDays === 1 ? 'Tag' : 'Tage'}
                  </div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">
                  {trainingInfo.totalDays}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {trainingInfo.totalDays === 1 ? 'Tag' : 'Tage'} Training
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-700">
                  {trainingInfo.daysUntilStart}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {trainingInfo.daysUntilStart === 1 ? 'Tag' : 'Tage'} bis Start
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <MapPin size={16} />
            Distanz
          </label>
          <div className="flex gap-2 mb-2">
            {(['5K', '10K', 'HM', 'M', 'CUSTOM'] as RaceDistance[]).map(
              (dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setDistance(dist)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    distance === dist
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {dist}
                </button>
              )
            )}
          </div>

          {distance === 'CUSTOM' && (
            <input
              type="number"
              step="0.1"
              value={customDistance}
              onChange={(e) => setCustomDistance(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Distanz in km"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Terrain
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTerrain('road')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                terrain === 'road'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Straße
            </button>
            <button
              type="button"
              onClick={() => setTerrain('trail')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                terrain === 'trail'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Mountain size={18} />
              Trail
            </button>
          </div>
        </div>

        {terrain === 'trail' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Mountain size={16} />
              Höhenmeter (optional)
            </label>
            <input
              type="number"
              value={elevationGain}
              onChange={(e) => setElevationGain(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="z.B. 1500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
            <Timer size={16} />
            Zielzeit (optional)
          </label>
          <input
            type="text"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. 45 oder 45:00 oder 1:30:00"
          />
          {calculatedPace && (
            <div className="mt-2 text-sm text-slate-600 bg-blue-50 px-3 py-2 rounded-lg">
              <strong>Pace:</strong> {formatPace(calculatedPace)}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
        >
          Trainingsplan erstellen
        </button>
      </form>
    </div>
  );
}
