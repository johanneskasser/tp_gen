import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IntervalSet } from '../../types';

interface IntervalVisualizationProps {
  intervals: IntervalSet[];
  warmUp?: number;
  warmUpUnit?: 'km' | 'min';
  coolDown?: number;
  coolDownUnit?: 'km' | 'min';
}

export function IntervalVisualization({
  intervals,
  warmUp,
  warmUpUnit,
  coolDown,
  coolDownUnit,
}: IntervalVisualizationProps) {
  const chartData = useMemo(() => {
    const data: Array<{ name: string; intensity: number; label: string }> = [];
    let position = 0;

    // Warm Up
    if (warmUp && warmUp > 0) {
      data.push({
        name: `${position}`,
        intensity: 30,
        label: `WU: ${warmUp}${warmUpUnit === 'min' ? 'min' : 'km'}`,
      });
      position++;
    }

    // Intervalle
    intervals.forEach((interval, idx) => {
      for (let rep = 0; rep < interval.repetitions; rep++) {
        // Interval (hoch)
        data.push({
          name: `${position}`,
          intensity: 90,
          label: `${interval.distance}km @ ${interval.pace || '?'}`,
        });
        position++;

        // Recovery (nur wenn nicht letzte Wiederholung)
        if (rep < interval.repetitions - 1 || idx < intervals.length - 1) {
          data.push({
            name: `${position}`,
            intensity: 20,
            label: `Pause: ${interval.recovery || '?'}`,
          });
          position++;
        }
      }
    });

    // Cool Down
    if (coolDown && coolDown > 0) {
      data.push({
        name: `${position}`,
        intensity: 30,
        label: `CD: ${coolDown}${coolDownUnit === 'min' ? 'min' : 'km'}`,
      });
    }

    return data;
  }, [intervals, warmUp, warmUpUnit, coolDown, coolDownUnit]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h4 className="text-sm font-medium text-slate-700 mb-3">Intervall-Visualisierung</h4>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#9ca3af"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#9ca3af"
            label={{ value: 'Intensität', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white px-3 py-2 rounded shadow-lg border border-slate-200">
                    <p className="text-xs font-medium">{payload[0].payload.label}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="stepAfter"
            dataKey="intensity"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#intensityGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-2 text-center">
        Zeigt die Intensitätswechsel während der Intervalleinheit
      </p>
    </div>
  );
}
