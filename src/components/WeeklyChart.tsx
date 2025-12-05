import { TrainingWeek, SessionType } from '../types';
import { UserProfile } from '../types/userProfile';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { calculateSessionDistance } from '../utils/calculationUtils';
import { SESSION_TYPE_CONFIG, getSessionTypeLabel } from '../constants/sessionTypes';
import { IntensityAnalyzer } from '../utils/intensityAnalyzer';
import { calculateWeeklyRelativeIntensity } from '../utils/personalizedIntensity';

interface WeeklyChartProps {
  weeks: TrainingWeek[];
  userProfile?: UserProfile; // Optional: for personalized intensity
}

interface ChartDataPoint {
  name: string;
  intensity: number; // Intensity score 0-100
  [key: string]: number | string;
}

export default function WeeklyChart({ weeks, userProfile }: WeeklyChartProps) {
  // Calculate distance by session type and intensity for each week
  const data: ChartDataPoint[] = weeks.map((week) => {
    const dataPoint: ChartDataPoint = {
      name: `W${week.weekNumber}`,
      intensity: 0,
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

    // Calculate intensity score for the week (0-100)
    // Use personalized intensity if user profile available, otherwise generic
    if (week.sessions.length > 0) {
      let intensityScore: number;

      if (userProfile && (userProfile.vdot || userProfile.personalBests.length > 0)) {
        // Personalized intensity based on user's fitness level
        intensityScore = calculateWeeklyRelativeIntensity(week.sessions, userProfile);
      } else {
        // Generic intensity based on session types
        const intensityAnalyzer = new IntensityAnalyzer(week.sessions);
        intensityScore = intensityAnalyzer.calculateWeeklyIntensityScore(week.sessions);
      }

      dataPoint.intensity = parseFloat(intensityScore.toFixed(1));
    }

    return dataPoint;
  });

  const totalKm = weeks.reduce((sum, week) => sum + week.totalKm, 0);
  const avgKm = totalKm / weeks.length;

  // Calculate average intensity
  const avgIntensity = data.reduce((sum, d) => sum + d.intensity, 0) / data.length;

  // Custom tooltip to show percentages and intensity
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      // Filter out the intensity line from the km calculations
      const kmPayload = payload.filter((entry: any) => entry.dataKey !== 'intensity');
      const intensityEntry = payload.find((entry: any) => entry.dataKey === 'intensity');

      const total = kmPayload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

      return (
        <div className="bg-white border border-slate-200 rounded-lg p-2 sm:p-3 shadow-lg max-w-xs">
          <p className="font-bold text-slate-800 mb-1 sm:mb-2 text-xs sm:text-sm">{payload[0].payload.name}</p>
          <p className="text-xs sm:text-sm text-slate-600 mb-1">Gesamt: {total.toFixed(1)} km</p>
          {intensityEntry && (
            <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1 sm:mb-2">
              Intensität: {intensityEntry.value.toFixed(0)}%
            </p>
          )}
          <div className="space-y-0.5 sm:space-y-1">
            {kmPayload.map((entry: any, index: number) => {
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                    <div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-700 truncate">{entry.name}</span>
                  </div>
                  <div className="text-right whitespace-nowrap flex-shrink-0">
                    <span className="font-medium text-slate-800">
                      {entry.value.toFixed(1)} km
                    </span>
                    <span className="text-slate-500 ml-1 sm:ml-2 text-[10px] sm:text-xs">({percentage}%)</span>
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
    <div id="weekly-chart" className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
          Wöchentliche Kilometer
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs sm:text-sm">
          <div>
            <span className="text-slate-600">Gesamt: </span>
            <span className="font-bold text-blue-600">{totalKm.toFixed(1)} km</span>
          </div>
          <div>
            <span className="text-slate-600">Durchschnitt: </span>
            <span className="font-bold text-slate-800">{avgKm.toFixed(1)} km/Woche</span>
          </div>
          <div>
            <span className="text-slate-600">Ø Intensität: </span>
            <span className="font-bold text-purple-600">{avgIntensity.toFixed(0)}%</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          <p>
            💡 Die Intensitätslinie zeigt die wöchentliche Trainingsbelastung (0-100%)
            {userProfile && (userProfile.vdot || userProfile.personalBests.length > 0) && (
              <span className="font-medium text-blue-600"> (personalisiert basierend auf deinem Fitnesslevel)</span>
            )}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }} className="sm:!mr-[40px] sm:!ml-[20px]">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            yAxisId="left"
            label={{ value: 'Kilometer', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            label={{ value: 'Intensität %', angle: 90, position: 'insideRight' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Stacked Bars for session types */}
          {Array.from(sessionTypes).map((type) => (
            <Bar
              key={type}
              yAxisId="left"
              dataKey={type}
              stackId="a"
              fill={SESSION_TYPE_CONFIG[type].chartColor}
              name={getSessionTypeLabel(type)}
            />
          ))}

          {/* Intensity Line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="intensity"
            stroke="#9333ea"
            strokeWidth={3}
            dot={{ fill: '#9333ea', r: 4 }}
            activeDot={{ r: 6 }}
            name="Intensität"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
