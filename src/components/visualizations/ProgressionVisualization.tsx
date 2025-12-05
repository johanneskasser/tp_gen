import { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ProgressionVisualizationProps {
  distance?: number;
  startPace?: string;
  endPace?: string;
}

// Konvertiere Pace (MM:SS) zu Sekunden pro km
function paceToSeconds(pace: string): number | null {
  if (!pace || !pace.includes(':')) return null;
  const [min, sec] = pace.split(':').map(Number);
  if (isNaN(min) || isNaN(sec)) return null;
  return min * 60 + sec;
}

// Konvertiere Sekunden zurück zu MM:SS Format
function secondsToPace(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function ProgressionVisualization({
  distance,
  startPace,
  endPace,
}: ProgressionVisualizationProps) {
  const chartData = useMemo(() => {
    if (!distance || !startPace || !endPace) return [];

    const startSeconds = paceToSeconds(startPace);
    const endSeconds = paceToSeconds(endPace);

    if (!startSeconds || !endSeconds) return [];

    const points = 20; // Anzahl Datenpunkte
    const distanceStep = distance / points;
    const paceChange = (endSeconds - startSeconds) / points;

    return Array.from({ length: points + 1 }, (_, i) => {
      const currentDistance = i * distanceStep;
      const currentPaceSeconds = startSeconds + i * paceChange;
      return {
        distance: currentDistance.toFixed(1),
        paceSeconds: currentPaceSeconds,
        pace: secondsToPace(currentPaceSeconds),
      };
    });
  }, [distance, startPace, endPace]);

  if (chartData.length === 0) {
    return null;
  }

  // Finde min/max für YAxis domain
  const paceSeconds = chartData.map((d) => d.paceSeconds);
  const minPace = Math.min(...paceSeconds);
  const maxPace = Math.max(...paceSeconds);
  const padding = (maxPace - minPace) * 0.1;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h4 className="text-sm font-medium text-slate-700 mb-3">Progression-Visualisierung</h4>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="progressionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="distance"
            label={{ value: 'Distanz (km)', position: 'insideBottom', offset: -5, fontSize: 10 }}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#9ca3af"
          />
          <YAxis
            domain={[minPace - padding, maxPace + padding]}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#9ca3af"
            label={{ value: 'Pace (min/km)', angle: -90, position: 'insideLeft', fontSize: 10 }}
            tickFormatter={(value) => secondsToPace(value)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white px-3 py-2 rounded shadow-lg border border-slate-200">
                    <p className="text-xs"><strong>Distanz:</strong> {payload[0].payload.distance} km</p>
                    <p className="text-xs"><strong>Pace:</strong> {payload[0].payload.pace} min/km</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="paceSeconds"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="url(#progressionGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-2 text-center">
        Zeigt die kontinuierliche Pace-Steigerung über die Distanz
      </p>
    </div>
  );
}
