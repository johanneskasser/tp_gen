import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FartlekSegment } from '../../types';

interface FartlekVisualizationProps {
  segments: FartlekSegment[];
  warmUp?: number;
  warmUpUnit?: 'km' | 'min';
  coolDown?: number;
  coolDownUnit?: 'km' | 'min';
}

const INTENSITY_COLORS = {
  easy: '#4ade80',     // green
  tempo: '#fbbf24',    // yellow/orange
  fast: '#ef4444',     // red
  warmup: '#94a3b8',   // gray
  cooldown: '#94a3b8', // gray
};

const INTENSITY_LABELS = {
  easy: 'Locker',
  tempo: 'Tempo',
  fast: 'Schnell',
  warmup: 'Warm Up',
  cooldown: 'Cool Down',
};

const INTENSITY_VALUES = {
  easy: 30,
  tempo: 60,
  fast: 90,
  warmup: 20,
  cooldown: 20,
};

export function FartlekVisualization({
  segments,
  warmUp,
  warmUpUnit,
  coolDown,
  coolDownUnit,
}: FartlekVisualizationProps) {
  const chartData = useMemo(() => {
    const data: Array<{
      name: string;
      duration: number;
      intensity: number;
      type: string;
      color: string;
      label: string;
    }> = [];

    // Warm Up
    if (warmUp && warmUp > 0) {
      data.push({
        name: 'WU',
        duration: warmUpUnit === 'min' ? warmUp : warmUp * 5, // Schätzung: 1km = 5min
        intensity: INTENSITY_VALUES.warmup,
        type: 'warmup',
        color: INTENSITY_COLORS.warmup,
        label: `WU: ${warmUp}${warmUpUnit === 'min' ? 'min' : 'km'}`,
      });
    }

    // Fartlek Segmente
    segments.forEach((segment, idx) => {
      data.push({
        name: `${idx + 1}`,
        duration: segment.duration,
        intensity: INTENSITY_VALUES[segment.type],
        type: segment.type,
        color: INTENSITY_COLORS[segment.type],
        label: `${INTENSITY_LABELS[segment.type]}: ${segment.duration}min${segment.pace ? ` @ ${segment.pace}` : ''}`,
      });
    });

    // Cool Down
    if (coolDown && coolDown > 0) {
      data.push({
        name: 'CD',
        duration: coolDownUnit === 'min' ? coolDown : coolDown * 5,
        intensity: INTENSITY_VALUES.cooldown,
        type: 'cooldown',
        color: INTENSITY_COLORS.cooldown,
        label: `CD: ${coolDown}${coolDownUnit === 'min' ? 'min' : 'km'}`,
      });
    }

    return data;
  }, [segments, warmUp, warmUpUnit, coolDown, coolDownUnit]);

  if (chartData.length === 0) {
    return null;
  }

  const totalDuration = chartData.reduce((sum, item) => sum + item.duration, 0);

  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-slate-700">Fartlek-Visualisierung</h4>
        <span className="text-xs text-slate-500">
          Gesamt: {totalDuration.toFixed(0)} min
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            label={{ value: 'Segment', position: 'insideBottom', offset: -20, fontSize: 10 }}
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
                const data = payload[0].payload;
                return (
                  <div className="bg-white px-3 py-2 rounded shadow-lg border border-slate-200">
                    <p className="text-xs font-medium">{data.label}</p>
                    <p className="text-xs text-slate-600">Intensität: {data.intensity}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legende */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: INTENSITY_COLORS.easy }}></div>
          <span className="text-xs text-slate-600">Locker</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: INTENSITY_COLORS.tempo }}></div>
          <span className="text-xs text-slate-600">Tempo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: INTENSITY_COLORS.fast }}></div>
          <span className="text-xs text-slate-600">Schnell</span>
        </div>
      </div>
    </div>
  );
}
