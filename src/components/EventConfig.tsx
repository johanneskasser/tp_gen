import { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { de } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../datepicker-custom.css';
import { RaceEvent, RaceDistance, TerrainType } from '../types';
import {
  Calendar,
  Mountain,
  Timer,
  Zap,
  Pencil,
  Route,
  ChevronDown,
  Copy,
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
  /** Fires whenever distance, targetTime, or the date pickers change — used by the parent to drive marketplace search */
  onSearchParamsChange?: (
    distance: RaceDistance,
    targetTime: string,
    startDate: Date | null,
    eventDate: Date | null
  ) => void;
  /** When defined the form shows a "Plan klonen" primary button (clone mode) */
  onClone?: (event: RaceEvent, startDate: string) => void;
  /** Called when user clicks "Neu erstellen" to exit clone mode */
  onDeselect?: () => void;
  /** Shows a loading spinner on the "Plan klonen" button */
  isCloneLoading?: boolean;
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
  onSearchParamsChange,
  onClone,
  onDeselect,
  isCloneLoading = false,
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

  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(initialData?.name || initialData?.terrain === 'trail' || initialData?.customDistance)
  );

  // Tracks which submit button was clicked so handleSubmit knows which action to run.
  // React onClick fires synchronously before the form's onSubmit, so the ref is
  // always set before handleSubmit reads it.
  const cloneModeRef = useRef(false);

  // Notify parent whenever search-relevant fields change
  useEffect(() => {
    onSearchParamsChange?.(distance, targetTime, startDate, eventDate);
  }, [distance, targetTime, startDate, eventDate, onSearchParamsChange]);

  const buildEvent = (): RaceEvent => ({
    name:
      name.trim() ||
      `${distance === 'CUSTOM' ? customDistance + ' km' : distance} Event`,
    date: formatDate(eventDate!),
    distance,
    customDistance:
      distance === 'CUSTOM' ? parseFloat(customDistance) : undefined,
    terrain,
    elevationGain:
      terrain === 'trail' && elevationGain ? parseInt(elevationGain) : undefined,
    targetTime: targetTime || undefined,
  });

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !startDate) return;

    const event = buildEvent();
    const startDateStr = formatDate(startDate);

    if (cloneModeRef.current && onClone) {
      onClone(event, startDateStr);
    } else {
      onSubmit(event, startDateStr);
    }
    cloneModeRef.current = false;
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

  const dateInputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-border-medium bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors';

  const sectionLabel =
    'block text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400';

  const isCloneMode = Boolean(onClone);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Hero: Distance selection ── */}
      <div className="space-y-3">
        <span className={sectionLabel}>Wettkampfdistanz</span>
        <div className="flex flex-wrap gap-2">
          {distanceOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDistance(opt.value)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold tracking-tight border-2 transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2',
                distance === opt.value
                  ? 'border-primary-600 bg-primary-600 text-white shadow-md shadow-primary-200 scale-[1.04]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700'
              )}
            >
              {opt.value === 'CUSTOM' && <Pencil size={13} className="shrink-0" />}
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
              rightIcon={
                <span className="text-xs font-bold text-slate-400">km</span>
              }
            />
          </div>
        )}
      </div>

      {/* ── Dates ── */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={sectionLabel}>Trainingsstart</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                locale="de"
                dateFormat="dd.MM.yyyy"
                className={cn(dateInputClass, 'pl-9')}
                placeholderText="TT.MM.JJJJ"
                required
                calendarStartDay={1}
              />
            </div>
            <p className="text-[11px] text-text-tertiary">
              Wochentag = Wochenstart
            </p>
          </div>

          <div className="space-y-1.5">
            <label className={sectionLabel}>Event Datum</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <DatePicker
                selected={eventDate}
                onChange={(date: Date | null) => setEventDate(date)}
                locale="de"
                dateFormat="dd.MM.yyyy"
                className={cn(dateInputClass, 'pl-9')}
                placeholderText="TT.MM.JJJJ"
                required
                calendarStartDay={1}
                minDate={startDate || undefined}
              />
            </div>
          </div>
        </div>

        {/* Training duration summary */}
        {trainingInfo && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
            <span className="font-bold text-primary-600 font-mono">
              {trainingInfo.weeks}
            </span>
            <span>{trainingInfo.weeks === 1 ? 'Woche' : 'Wochen'}</span>
            {trainingInfo.remainingDays > 0 && (
              <span className="text-slate-400">+{trainingInfo.remainingDays}d</span>
            )}
            <span className="text-slate-300">·</span>
            <span className="font-bold text-primary-600 font-mono">
              {trainingInfo.totalDays}
            </span>
            <span>Tage</span>
            <span className="text-slate-300">·</span>
            <span>Noch</span>
            <span className="font-bold text-primary-600 font-mono">
              {trainingInfo.daysUntilStart}
            </span>
            <span>Tage bis Start</span>
          </div>
        )}
      </div>

      {/* ── Zielzeit ── */}
      <div className="space-y-2">
        <Input
          type="text"
          label={
            <span>
              Zielzeit{' '}
              <span className="text-xs font-normal text-text-tertiary normal-case tracking-normal">
                (optional)
              </span>
            </span>
          }
          value={targetTime}
          onChange={(e) => setTargetTime(e.target.value)}
          placeholder="z.B. 45:00 oder 1:30:00"
          leftIcon={<Timer className="w-4 h-4" />}
          helperText="Format: MM:SS oder HH:MM:SS"
        />
        {calculatedPace && (
          <div className="flex items-center gap-2 text-xs font-semibold text-primary-700 bg-primary-50/80 border border-primary-100 px-3 py-2 rounded-lg">
            <Zap size={12} className="shrink-0 text-primary-500" />
            <span>
              Ø Pace:{' '}
              <span className="font-mono">{formatPace(calculatedPace)}</span>{' '}
              min/km
            </span>
          </div>
        )}
      </div>

      {/* ── Advanced toggle ── */}
      <div>
        <div className="border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
          >
            <ChevronDown
              size={13}
              className={cn(
                'transition-transform duration-200',
                showAdvanced && 'rotate-180'
              )}
            />
            Weitere Details {showAdvanced ? 'ausblenden' : 'einblenden'}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <Input
              label="Event Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Berlin Marathon 2025"
              leftIcon={<Route className="w-4 h-4" />}
            />

            <div className="space-y-1.5">
              <label className={sectionLabel}>Terrain</label>
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
                  <Zap size={15} />
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
                  <Mountain size={15} />
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
                rightIcon={
                  <span className="text-xs font-bold text-slate-400">hm</span>
                }
              />
            )}
          </div>
        )}
      </div>

      {/* ── Submit area ── */}
      <div className="pt-2 space-y-2">
        {isCloneMode ? (
          <>
            {/* Clone mode: primary = clone, secondary = create fresh */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isCloneLoading}
              onClick={() => { cloneModeRef.current = true; }}
            >
              <Copy size={16} />
              Plan klonen
            </Button>
            <button
              type="submit"
              onClick={() => {
                cloneModeRef.current = false;
                onDeselect?.();
              }}
              className="w-full text-sm text-slate-400 hover:text-slate-600 py-1.5 transition-colors focus:outline-none"
            >
              Lieber neu erstellen →
            </button>
          </>
        ) : (
          <Button type="submit" fullWidth size="lg">
            Trainingsplan erstellen
          </Button>
        )}
      </div>
    </form>
  );
}
