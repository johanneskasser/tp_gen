import { useState, useEffect, useRef } from 'react';
import { PersonalBest } from '../types/userProfile';
import { validateTimeInput, getTimeWarning } from '../utils/timeValidator';
import { Check, X, AlertCircle, Calendar, Clock } from 'lucide-react';
import { cn } from '../lib/designSystem';

interface PersonalBestInputProps {
  initialValue?: Partial<PersonalBest>;
  onSave: (pb: PersonalBest) => void;
  onCancel?: () => void;
  saveButtonText?: string;
  showCancelButton?: boolean;
}

const DISTANCE_OPTIONS = [
  { value: '5K', label: '5K', icon: '🏃', km: 5 },
  { value: '10K', label: '10K', icon: '🏃‍♂️', km: 10 },
  { value: 'HALF_MARATHON', label: 'Halbmarathon', icon: '🏃‍♀️', km: 21.0975 },
  { value: 'MARATHON', label: 'Marathon', icon: '🎽', km: 42.195 },
  { value: 'CUSTOM', label: 'Andere', icon: '📏', km: 0 },
] as const;

export function PersonalBestInput({
  initialValue,
  onSave,
  onCancel,
  saveButtonText = 'Speichern',
  showCancelButton = true,
}: PersonalBestInputProps) {
  const [distance, setDistance] = useState<PersonalBest['distance']>(
    initialValue?.distance || '10K'
  );
  const [customKm, setCustomKm] = useState<string>(
    initialValue?.customDistanceKm?.toString() || ''
  );
  const [time, setTime] = useState(initialValue?.time || '');
  const [date, setDate] = useState(
    initialValue?.date || new Date().toISOString().split('T')[0]
  );
  const [touched, setTouched] = useState({
    time: false,
    customKm: false,
  });
  const [warning, setWarning] = useState<string | null>(null);

  const timeInputRef = useRef<HTMLInputElement>(null);
  const prevTimeRef = useRef(time);

  // Validate time
  const timeValidation = validateTimeInput(time);
  const showTimeError = touched.time && !timeValidation.isValid;

  // Validate custom distance
  const customKmNum = parseFloat(customKm);
  const isCustomKmValid = distance !== 'CUSTOM' || (customKmNum > 0 && customKmNum <= 200);
  const showCustomKmError = touched.customKm && !isCustomKmValid;

  // Check if form is valid
  const isFormValid =
    timeValidation.isValid &&
    (distance !== 'CUSTOM' || isCustomKmValid);

  // Update warning when time or distance changes
  useEffect(() => {
    if (timeValidation.isValid && timeValidation.totalSeconds) {
      const distanceKm = distance === 'CUSTOM' ? customKmNum : DISTANCE_OPTIONS.find(d => d.value === distance)?.km || 0;
      if (distanceKm > 0) {
        setWarning(getTimeWarning(distanceKm, timeValidation.totalSeconds));
      }
    } else {
      setWarning(null);
    }
  }, [time, distance, customKm, timeValidation.isValid, timeValidation.totalSeconds, customKmNum]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow digits and colons only
    const cleaned = newValue.replace(/[^\d:]/g, '');
    setTime(cleaned);
    prevTimeRef.current = cleaned;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({ time: true, customKm: true });

    if (!isFormValid || !timeValidation.formattedTime) {
      return;
    }

    const pb: PersonalBest = {
      distance,
      time: timeValidation.formattedTime,
      customDistanceKm: distance === 'CUSTOM' ? customKmNum : undefined,
      date,
    };

    onSave(pb);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Distance Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Distanz
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DISTANCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setDistance(option.value);
                if (option.value !== 'CUSTOM') {
                  setCustomKm('');
                  setTouched(prev => ({ ...prev, customKm: false }));
                }
              }}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all duration-200',
                'hover:scale-[1.02] active:scale-[0.98]',
                'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
                distance === option.value
                  ? 'border-primary-600 bg-primary-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-primary-300 hover:bg-slate-50'
              )}
            >
              <div className="text-2xl mb-1">{option.icon}</div>
              <div className={cn(
                'text-sm font-medium',
                distance === option.value ? 'text-primary-700' : 'text-slate-700'
              )}>
                {option.label}
              </div>
              {distance === option.value && (
                <div className="absolute top-2 right-2">
                  <Check className="text-primary-600" size={16} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Custom Distance Input */}
        {distance === 'CUSTOM' && (
          <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Distanz in Kilometern
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="200"
                value={customKm}
                onChange={(e) => setCustomKm(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, customKm: true }))}
                placeholder="z.B. 15"
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border-2 transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary-400',
                  showCustomKmError
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 focus:border-primary-400'
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                km
              </div>
            </div>
            {showCustomKmError && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <X size={12} />
                Bitte gib eine gültige Distanz ein (0.1 - 200 km)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Time Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Zeit
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Clock size={18} />
          </div>
          <input
            ref={timeInputRef}
            type="text"
            value={time}
            onChange={handleTimeChange}
            onBlur={() => setTouched(prev => ({ ...prev, time: true }))}
            placeholder="MM:SS oder HH:MM:SS"
            className={cn(
              'w-full pl-11 pr-11 py-3 rounded-lg border-2 transition-all',
              'text-lg font-mono tracking-wider',
              'focus:outline-none focus:ring-2 focus:ring-primary-400',
              showTimeError
                ? 'border-red-300 bg-red-50'
                : timeValidation.isValid
                ? 'border-green-300 bg-green-50'
                : 'border-slate-200 focus:border-primary-400'
            )}
          />
          {timeValidation.isValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
              <Check size={20} />
            </div>
          )}
          {showTimeError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
              <X size={20} />
            </div>
          )}
        </div>

        {/* Time feedback */}
        <div className="mt-1.5 min-h-[20px]">
          {showTimeError && timeValidation.error && (
            <p className="text-xs text-red-600 flex items-center gap-1 animate-in fade-in duration-150">
              <X size={12} />
              {timeValidation.error}
            </p>
          )}
          {!showTimeError && timeValidation.isValid && (
            <p className="text-xs text-green-600 flex items-center gap-1 animate-in fade-in duration-150">
              <Check size={12} />
              Gültige Zeit
            </p>
          )}
          {!time && !touched.time && (
            <p className="text-xs text-slate-500">
              Beispiele: 45:30 oder 3:25:15
            </p>
          )}
        </div>

        {/* Warning */}
        {warning && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              {warning}
            </p>
          </div>
        )}
      </div>

      {/* Date Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Datum
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Calendar size={18} />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={cn(
              'w-full pl-11 pr-4 py-2.5 rounded-lg border-2 border-slate-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
              'transition-all'
            )}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Wann hast du diese Bestzeit erreicht?
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!isFormValid}
          className={cn(
            'flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            isFormValid
              ? 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-sm hover:shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {saveButtonText}
        </button>
        {showCancelButton && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'px-6 py-3 rounded-lg font-medium transition-all duration-200',
              'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98]',
              'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2'
            )}
          >
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
