import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { de } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker-custom.css';
import { RaceEvent, RaceDistance, TerrainType } from '../types';
import { Calendar, Mountain, MapPin, Timer } from 'lucide-react';
import { calculatePace, formatPace } from '../utils/paceCalculator';
import { getRaceDistanceKm } from '../utils/calculationUtils';
import { Button, Input, Card } from './ui';
import { typography, cn } from '../lib/designSystem';

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
    <Card variant="default" className="max-w-sm sm:max-w-2xl mx-auto">
      <h2 className={cn(typography.h2, 'mb-4 sm:mb-6 flex items-center gap-2')}>
        <Calendar className="text-primary-700" size={20} />
        Event Konfiguration
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <Input
          type="text"
          label="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Berlin Marathon 2024"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Startdatum Training
            </label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              locale="de"
              dateFormat="dd.MM.yyyy"
              className="w-full px-3 sm:px-4 py-2.5 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm sm:text-base bg-white"
              placeholderText="Datum wählen"
              required
              calendarStartDay={1}
            />
            <p className={cn(typography.caption, 'text-text-tertiary mt-1.5')}>
              Woche startet am gewählten Wochentag
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Event Datum
            </label>
            <DatePicker
              selected={eventDate}
              onChange={(date: Date | null) => setEventDate(date)}
              locale="de"
              dateFormat="dd.MM.yyyy"
              className="w-full px-3 sm:px-4 py-2.5 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm sm:text-base bg-white"
              placeholderText="Datum wählen"
              required
              calendarStartDay={1}
              minDate={startDate || undefined}
            />
          </div>
        </div>

        {trainingInfo && (
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <div className={cn(typography.numberLarge, 'text-primary-700')}>
                  {trainingInfo.weeks}
                </div>
                <div className={cn(typography.caption, 'text-text-secondary mt-1')}>
                  {trainingInfo.weeks === 1 ? 'Woche' : 'Wochen'}
                </div>
                {trainingInfo.remainingDays > 0 && (
                  <div className={cn(typography.caption, 'text-text-tertiary mt-0.5')}>
                    + {trainingInfo.remainingDays} {trainingInfo.remainingDays === 1 ? 'Tag' : 'Tage'}
                  </div>
                )}
              </div>
              <div>
                <div className={cn(typography.numberLarge, 'text-primary-700')}>
                  {trainingInfo.totalDays}
                </div>
                <div className={cn(typography.caption, 'text-text-secondary mt-1')}>
                  {trainingInfo.totalDays === 1 ? 'Tag' : 'Tage'} Training
                </div>
              </div>
              <div>
                <div className={cn(typography.numberLarge, 'text-primary-800')}>
                  {trainingInfo.daysUntilStart}
                </div>
                <div className={cn(typography.caption, 'text-text-secondary mt-1')}>
                  {trainingInfo.daysUntilStart === 1 ? 'Tag' : 'Tage'} bis Start
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
            <MapPin size={16} />
            Distanz
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(['5K', '10K', 'HM', 'M', 'CUSTOM'] as RaceDistance[]).map(
              (dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setDistance(dist)}
                  className={cn(
                    'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base',
                    distance === dist
                      ? 'bg-primary-700 text-white'
                      : 'bg-background-tertiary text-text-primary hover:bg-primary-100'
                  )}
                >
                  {dist}
                </button>
              )
            )}
          </div>

          {distance === 'CUSTOM' && (
            <Input
              type="number"
              step="0.1"
              value={customDistance}
              onChange={(e) => setCustomDistance(e.target.value)}
              placeholder="Distanz in km"
              required
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Terrain
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTerrain('road')}
              className={cn(
                'flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base',
                terrain === 'road'
                  ? 'bg-primary-700 text-white'
                  : 'bg-background-tertiary text-text-primary hover:bg-primary-100'
              )}
            >
              Straße
            </button>
            <button
              type="button"
              onClick={() => setTerrain('trail')}
              className={cn(
                'flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base',
                terrain === 'trail'
                  ? 'bg-primary-700 text-white'
                  : 'bg-background-tertiary text-text-primary hover:bg-primary-100'
              )}
            >
              <Mountain size={18} />
              Trail
            </button>
          </div>
        </div>

        {terrain === 'trail' && (
          <Input
            type="number"
            label={
              <span className="flex items-center gap-2">
                <Mountain size={16} />
                Höhenmeter (optional)
              </span>
            }
            value={elevationGain}
            onChange={(e) => setElevationGain(e.target.value)}
            placeholder="z.B. 1500"
          />
        )}

        <div>
          <Input
            type="text"
            label={
              <span className="flex items-center gap-2">
                <Timer size={16} />
                Zielzeit (optional)
              </span>
            }
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            placeholder="z.B. 45 oder 45:00 oder 1:30:00"
          />
          {calculatedPace && (
            <div className={cn(
              typography.bodySmall,
              'mt-2 text-text-secondary bg-primary-50 px-3 py-2 rounded-lg'
            )}>
              <strong>Pace:</strong> {formatPace(calculatedPace)}
            </div>
          )}
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
        >
          Trainingsplan erstellen
        </Button>
      </form>
    </Card>
  );
}
