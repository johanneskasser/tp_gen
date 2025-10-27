import { TrainingWeek, SessionType } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { calculateSessionDistance } from '../utils/calculationUtils';
import { SESSION_TYPE_CONFIG, getSessionTypeLabel } from '../constants/sessionTypes';

interface WeeklyChartProps {
  weeks: TrainingWeek[];
}

interface ChartDataPoint {
  name: string;
  [key: string]: number | string;
}

export default function WeeklyChart({ weeks }: WeeklyChartProps) {
  // Calculate distance by session type for each week
  const data: ChartDataPoint[] = weeks.map((week) => {
    const dataPoint: ChartDataPoint = {
      name: `W${week.weekNumber}`,
    };

    // Group sessions by type and sum their distances
    const typeDistances: Record<string, number> = {};
    week.sessions.forEach((session) => {
      const distance = calculateSessionDistance(session);
      typeDistances[session.type] = (typeDistances[session.type] || 0) + distance;
    });

    // Add each type to the data point
    Object.entries(typeDistances).forEach(([type, distance]) => {
      dataPoint[type] = parseFloat(distance.toFixed(1));
    });

    return dataPoint;
  });

  const totalKm = weeks.reduce((sum, week) => sum + week.totalKm, 0);
  const avgKm = totalKm / weeks.length;

  // Custom tooltip to show percentages
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

      return (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-slate-800 mb-2">{payload[0].payload.name}</p>
          <p className="text-sm text-slate-600 mb-2">Gesamt: {total.toFixed(1)} km</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-700">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-slate-800">
                      {entry.value.toFixed(1)} km
                    </span>
                    <span className="text-slate-500 ml-2">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get all session types that appear in the data
  const sessionTypes = new Set<SessionType>();
  weeks.forEach(week => {
    week.sessions.forEach(session => {
      sessionTypes.add(session.type);
    });
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          Wöchentliche Kilometer
        </h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-slate-600">Gesamt: </span>
            <span className="font-bold text-blue-600">{totalKm.toFixed(1)} km</span>
          </div>
          <div>
            <span className="text-slate-600">Durchschnitt: </span>
            <span className="font-bold text-slate-800">{avgKm.toFixed(1)} km/Woche</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Kilometer', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {Array.from(sessionTypes).map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="a"
              fill={SESSION_TYPE_CONFIG[type].chartColor}
              name={getSessionTypeLabel(type)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
