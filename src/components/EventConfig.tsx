import { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { de } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker-custom.css';
import { RaceEvent, RaceDistance, TerrainType } from '../types';
import {
  Calendar,
  Mountain,
  MapPin,
  Timer,
  Zap,
  Pencil,
  Route,
} from 'lucide-react';
import { calculatePace, formatPace } from '../utils/paceCalculator';
import { getRaceDistanceKm } from '../utils/calculationUtils';
import { Button, Input } from './ui';
import { cn } from '../lib/designSystem';

registerLocale('de', de);

interface EventConfigProps {
  onSubmit: (event: RaceEvent, startDate: string) => void;
  initialData?: RaceEvent;
  initialStartDate?: string;
}

const distanceOptions: { value: RaceDistance; label: string; km: string }[] = [
  { value: '5K', label: '5 km', km: '5' },
  { value: '10K', label: '10 km', km: '10' },
  { value: 'HM', label: 'Halbmarathon', km: '21,1' },
  { value: 'M', label: 'Marathon', km: '42,2' },
  { value: 'CUSTOM', label: 'Eigene Distanz', km: '' },
];

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
      customDistance:
        distance === 'CUSTOM' ? parseFloat(customDistance) : undefined,
      terrain,
      elevationGain:
        terrain === 'trail' && elevationGain
          ? parseInt(elevationGain)
          : undefined,
      targetTime: targetTime || undefined,
    };

    onSubmit(event, formatDate(startDate));
  };

  const calculatedPace = (() => {
    if (!targetTime) return '';
    const distKm =
      distance === 'CUSTOM' && customDistance
        ? parseFloat(customDistance)
        : getRaceDistanceKm(distance);
    return calculatePace(targetTime, distKm);
  })();

  const trainingInfo = (() => {
    if (!startDate || !eventDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(eventDate);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    const daysUntilStart = Math.ceil(
      (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return { totalDays, weeks, remainingDays, daysUntilStart };
  })();

  // Consistent date input class that matches the Input component styling
  const dateInputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-border-medium bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section 1: Event details ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Event Details
        </h3>

        <Input
          label="Event Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Berlin Marathon 2025"
          required
          leftIcon={<Route className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">
              Trainingsstart
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                <Calendar className="w-4 h-4" />
              </div>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                locale="de"
                dateFormat="dd.MM.yyyy"
                className={cn(dateInputClass, 'pl-10')}
                placeholderText="Datum wählen"
                required
                calendarStartDay={1}
              />
            </div>
            <p className="text-xs text-text-tertiary">
              Wochentag bestimmt den Wochenstart
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">
              Event Datum
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                <Calendar className="w-4 h-4" />
              </div>
              <DatePicker
                selected={eventDate}
                onChange={(date: Date | null) => setEventDate(date)}
                locale="de"
                dateFormat="dd.MM.yyyy"
                className={cn(dateInputClass, 'pl-10')}
                placeholderText="Datum wählen"
                required
                calendarStartDay={1}
                minDate={startDate || undefined}
              />
            </div>
          </div>
        </div>

        {/* Training overview - appears once dates are set */}
        {trainingInfo && (
          <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-3">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-text-secondary">
                <span className="font-semibold text-primary-700 font-mono">
                  {trainingInfo.weeks}
                </span>{' '}
                {trainingInfo.weeks === 1 ? 'Woche' : 'Wochen'}
                {trainingInfo.remainingDays > 0 && (
                  <span className="text-text-tertiary">
                    {' '}
                    + {trainingInfo.remainingDays}d
                  </span>
                )}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-text-secondary">
                <span className="font-semibold text-primary-700 font-mono">
                  {trainingInfo.totalDays}
                </span>{' '}
                Tage gesamt
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-text-secondary">
                Noch{' '}
                <span className="font-semibold text-primary-700 font-mono">
                  {trainingInfo.daysUntilStart}
                </span>{' '}
                Tage bis Start
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── Section 2: Distance & Terrain ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Distanz & Terrain
        </h3>

        {/* Distance pills */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary flex items-center gap-1.5">
            <MapPin size={14} />
            Distanz
          </label>
          <div className="flex flex-wrap gap-2">
            {distanceOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDistance(opt.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors',
                  distance === opt.value
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                {opt.value === 'CUSTOM' && <Pencil size={13} />}
                {opt.label}
              </button>
            ))}
          </div>

          {distance === 'CUSTOM' && (
            <div className="pt-1">
              <Input
                type="number"
                step="0.1"
                value={customDistance}
                onChange={(e) => setCustomDistance(e.target.value)}
                placeholder="Distanz in km"
                required
                rightIcon={<span className="text-xs text-text-tertiary">km</span>}
              />
            </div>
          )}
        </div>

        {/* Terrain toggle */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-text-secondary">
            Terrain
          </label>
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setTerrain('road')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                terrain === 'road'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Zap size={16} />
              Straße
            </button>
            <button
              type="button"
              onClick={() => setTerrain('trail')}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                terrain === 'trail'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Mountain size={16} />
              Trail
            </button>
          </div>
        </div>

        {terrain === 'trail' && (
          <Input
            type="number"
            label="Höhenmeter (optional)"
            value={elevationGain}
            onChange={(e) => setElevationGain(e.target.value)}
            placeholder="z.B. 1500"
            leftIcon={<Mountain className="w-4 h-4" />}
            rightIcon={<span className="text-xs text-text-tertiary">hm</span>}
          />
        )}
      </section>

      {/* ── Section 3: Performance ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Leistungsziel (optional)
        </h3>

        <Input
          type="text"
          label="Zielzeit"
          value={targetTime}
          onChange={(e) => setTargetTime(e.target.value)}
          placeholder="z.B. 45:00 oder 1:30:00"
          leftIcon={<Timer className="w-4 h-4" />}
          helperText="Format: MM:SS oder HH:MM:SS"
        />

        {calculatedPace && (
          <div className="flex items-center gap-2 text-sm text-primary-700 bg-primary-50 border border-primary-100 px-3 py-2.5 rounded-lg">
            <Zap size={14} className="shrink-0" />
            <span>
              Durchschnittliche Pace:{' '}
              <span className="font-semibold font-mono">
                {formatPace(calculatedPace)}
              </span>
            </span>
          </div>
        )}
      </section>

      {/* ── Submit ── */}
      <div className="pt-2">
        <Button type="submit" fullWidth size="lg">
          Trainingsplan erstellen
        </Button>
      </div>
    </form>
  );
}
