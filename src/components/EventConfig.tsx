import { useState } from 'react';
import { RaceEvent, RaceDistance, TerrainType } from '../types';
import { Calendar, Mountain, MapPin, Timer } from 'lucide-react';
import { calculatePace, formatPace } from '../utils/paceCalculator';
import { getRaceDistanceKm } from '../utils/calculationUtils';

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
  const [date, setDate] = useState(initialData?.date || '');
  const [startDate, setStartDate] = useState(initialStartDate || '');
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

    const event: RaceEvent = {
      name,
      date,
      distance,
      customDistance: distance === 'CUSTOM' ? parseFloat(customDistance) : undefined,
      terrain,
      elevationGain: terrain === 'trail' && elevationGain ? parseInt(elevationGain) : undefined,
      targetTime: targetTime || undefined,
    };

    onSubmit(event, startDate);
  };

  // Calculate pace when targetTime or distance changes
  const calculatedPace = (() => {
    if (!targetTime) return '';
    const distKm = distance === 'CUSTOM' && customDistance
      ? parseFloat(customDistance)
      : getRaceDistanceKm(distance);

    console.log('Debug Pace Calc:', { targetTime, distance, distKm, calculatedPace: calculatePace(targetTime, distKm) });

    return calculatePace(targetTime, distKm);
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
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Event Datum
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

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
