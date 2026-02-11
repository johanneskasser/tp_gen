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

// Helper: Convert pace string "4:30" to numeric value 4.5 (min/km)
function parsePaceToMinPerKm(pace: string | undefined): number | null {
  if (!pace) return null;
  const match = pace.match(/(\d+):(\d+)/);
  if (!match) return null;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  return minutes + seconds / 60;
}

// Helper: Convert min to approximate km (assuming 6:00/km easy pace for estimation)
function minToKm(minutes: number, estimatedPace: number = 6.0): number {
  return minutes / estimatedPace;
}

export function IntervalVisualization({
  intervals,
  warmUp,
  warmUpUnit,
  coolDown,
  coolDownUnit,
}: IntervalVisualizationProps) {
  const chartData = useMemo(() => {
    const data: Array<{ distance: number; pace: number | null; label: string; type: string }> = [];
    let cumulativeDistance = 0;

    // Estimate easy pace for warmup/cooldown (6:00/km)
    const easyPace = 6.0;

    // Warm Up
    if (warmUp && warmUp > 0) {
      const warmUpKm = warmUpUnit === 'min' ? minToKm(warmUp, easyPace) : warmUp;
      data.push({
        distance: cumulativeDistance,
        pace: easyPace,
        label: `WU: ${warmUp}${warmUpUnit === 'min' ? 'min' : 'km'}`,
        type: 'warmup',
      });
      cumulativeDistance += warmUpKm;
      data.push({
        distance: cumulativeDistance,
        pace: easyPace,
        label: `WU Ende`,
        type: 'warmup',
      });
    }

    // Intervalle
    intervals.forEach((interval, idx) => {
      const intervalPace = parsePaceToMinPerKm(interval.pace) || 4.0; // Default 4:00/km if no pace
      const recoveryPace = 7.0; // Easy recovery pace

      for (let rep = 0; rep < interval.repetitions; rep++) {
        // Interval Start
        const startDist = cumulativeDistance;
        data.push({
          distance: startDist,
          pace: intervalPace,
          label: `${interval.distance}km @ ${interval.pace || '4:00'}`,
          type: 'interval',
        });

        // Interval End
        cumulativeDistance += interval.distance;
        data.push({
          distance: cumulativeDistance,
          pace: intervalPace,
          label: `${interval.distance}km Ende`,
          type: 'interval',
        });

        // Recovery (nur wenn nicht letzte Wiederholung)
        if (rep < interval.repetitions - 1 || idx < intervals.length - 1) {
          const recoveryValue = parseFloat(interval.recovery || '0');
          const recoveryKm = interval.recoveryUnit === 'min'
            ? minToKm(recoveryValue, recoveryPace)
            : recoveryValue;

          if (recoveryKm > 0) {
            const recoveryStart = cumulativeDistance;
            data.push({
              distance: recoveryStart,
              pace: recoveryPace,
              label: `Pause: ${interval.recovery || '?'}${interval.recoveryUnit === 'min' ? 'min' : 'km'}`,
              type: 'recovery',
            });

            cumulativeDistance += recoveryKm;
            data.push({
              distance: cumulativeDistance,
              pace: recoveryPace,
              label: `Pause Ende`,
              type: 'recovery',
            });
          }
        }
      }
    });

    // Cool Down
    if (coolDown && coolDown > 0) {
      const coolDownKm = coolDownUnit === 'min' ? minToKm(coolDown, easyPace) : coolDown;
      data.push({
        distance: cumulativeDistance,
        pace: easyPace,
        label: `CD: ${coolDown}${coolDownUnit === 'min' ? 'min' : 'km'}`,
        type: 'cooldown',
      });
      cumulativeDistance += coolDownKm;
      data.push({
        distance: cumulativeDistance,
        pace: easyPace,
        label: `CD Ende`,
        type: 'cooldown',
      });
    }

    return data;
  }, [intervals, warmUp, warmUpUnit, coolDown, coolDownUnit]);

  if (chartData.length === 0) {
    return null;
  }

  // Calculate y-axis domain (pace range, inverted because lower pace is faster)
  const paces = chartData.map(d => d.pace).filter((p): p is number => p !== null);
  const minPace = Math.min(...paces);
  const maxPace = Math.max(...paces);
  const paceBuffer = (maxPace - minPace) * 0.1 || 1;

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <h4 className="text-sm font-medium text-slate-700 mb-3">Intervall-Visualisierung</h4>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="distance"
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#9ca3af"
            label={{ value: 'Distanz (km)', position: 'insideBottom', offset: -5, fontSize: 10 }}
            tickFormatter={(value) => value.toFixed(1)}
          />
          <YAxis
            dataKey="pace"
            domain={[minPace - paceBuffer, maxPace + paceBuffer]}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            stroke="#9ca3af"
            label={{ value: 'Pace (min/km)', angle: -90, position: 'insideLeft', fontSize: 10 }}
            reversed={true}
            tickFormatter={(value) => {
              const mins = Math.floor(value);
              const secs = Math.round((value - mins) * 60);
              return `${mins}:${secs.toString().padStart(2, '0')}`;
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                const pace = data.pace;
                const paceStr = pace
                  ? `${Math.floor(pace)}:${Math.round((pace - Math.floor(pace)) * 60).toString().padStart(2, '0')}/km`
                  : '?';
                return (
                  <div className="bg-white px-3 py-2 rounded shadow-lg border border-slate-200">
                    <p className="text-xs font-semibold">{data.label}</p>
                    <p className="text-xs text-slate-600">Distanz: {data.distance.toFixed(2)} km</p>
                    <p className="text-xs text-slate-600">Pace: {paceStr}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="linear"
            dataKey="pace"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#paceGradient)"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500 mt-2 text-center">
        Zeigt Pace-Verlauf über die Distanz • Niedrigere Pace = Schneller
      </p>
    </div>
  );
}
