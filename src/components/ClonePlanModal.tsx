import { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button, Input } from './ui';
import { MarketplacePlan } from '../types/marketplace';
import { TrainingPlan, TrainingWeek, TrainingSession } from '../types';
import { marketplaceService } from '../services/marketplaceService';
import { calculateWeeks } from '../utils/dateUtils';
import { calculateWeeklyKm } from '../utils/calculationUtils';
import { typography, cn } from '../lib/designSystem';
import { Calendar, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { analytics } from '../utils/analytics';

interface ClonePlanModalProps {
  plan: MarketplacePlan;
  onClose: () => void;
  onSuccess: (newPlanId: string) => void;
}

export default function ClonePlanModal({ plan, onClose, onSuccess }: ClonePlanModalProps) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventDate, setEventDate] = useState('');
  const [eventName, setEventName] = useState(plan.plan_data.event.name);
  const [loading, setLoading] = useState(false);

  const originalWeeksCount = plan.plan_data.weeks.length;

  const handleClone = async () => {
    if (!startDate || !eventDate) {
      alert('Bitte wähle Start- und Event-Datum aus');
      return;
    }

    const start = parseISO(startDate);
    const event = parseISO(eventDate);

    if (event <= start) {
      alert('Event-Datum muss nach dem Startdatum liegen');
      return;
    }

    try {
      setLoading(true);

      // Calculate new weeks based on dates
      const newWeekStructures = calculateWeeks(startDate, eventDate);

      // Map original sessions to new week structure
      const newWeeks: TrainingWeek[] = newWeekStructures.map((weekStructure, idx) => {
        // Get original week data (reuse if available, or use last week as template)
        const originalWeek =
          plan.plan_data.weeks[idx] || plan.plan_data.weeks[plan.plan_data.weeks.length - 1];

        const newWeek: TrainingWeek = {
          ...weekStructure,
          sessions: originalWeek.sessions.map((session: TrainingSession) => ({
            ...session,
          })),
          totalKm: 0, // Will be recalculated below
        };

        // Recalculate totalKm
        newWeek.totalKm = calculateWeeklyKm(newWeek.sessions);

        return newWeek;
      });

      // Create new plan
      const newPlan: TrainingPlan = {
        ...plan.plan_data,
        event: {
          ...plan.plan_data.event,
          name: eventName,
          date: eventDate,
        },
        startDate,
        weeks: newWeeks,
      };

      // Clone via service
      const newPlanId = await marketplaceService.clonePlan(plan.id, newPlan);

      analytics.trackPlanCloned(plan.plan_data.event.distance);
      onSuccess(newPlanId);
    } catch (err) {
      console.error('Error cloning plan:', err);
      alert('Fehler beim Kopieren des Plans');
    } finally {
      setLoading(false);
    }
  };

  const calculateNewWeeksCount = () => {
    if (!startDate || !eventDate) return null;

    const start = parseISO(startDate);
    const event = parseISO(eventDate);

    if (event <= start) return null;

    const weeks = calculateWeeks(startDate, eventDate);
    return weeks.length;
  };

  const newWeeksCount = calculateNewWeeksCount();

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Plan kopieren & anpassen"
      size="md"
      footer={
        <>
          <Button onClick={onClose} variant="secondary">
            Abbrechen
          </Button>
          <Button
            onClick={handleClone}
            variant="default"
            disabled={loading || !startDate || !eventDate || !eventName}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Kopiere...' : 'Plan kopieren'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className={cn(typography.bodySmall, 'text-blue-800')}>
            Du kannst diesen Plan an deinen eigenen Zeitraum anpassen. Die Trainingseinheiten
            werden automatisch auf die neuen Wochen verteilt.
          </p>
        </div>

        {/* Event Name */}
        <div>
          <label className={cn(typography.bodySmall, 'font-semibold mb-2 block')}>
            Event-Name
          </label>
          <Input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="z.B. Berlin Marathon 2025"
          />
        </div>

        {/* Start Date */}
        <div>
          <label className={cn(typography.bodySmall, 'font-semibold mb-2 block')}>
            Startdatum
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            leftIcon={<Calendar size={18} />}
          />
        </div>

        {/* Event Date */}
        <div>
          <label className={cn(typography.bodySmall, 'font-semibold mb-2 block')}>
            Event-Datum
          </label>
          <Input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            leftIcon={<Calendar size={18} />}
            min={startDate}
          />
        </div>

        {/* Week Count Comparison */}
        {newWeeksCount !== null && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className={cn(typography.h4, 'mb-2')}>Trainingsumfang</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className={typography.bodySmall}>Original:</span>
                <span className={cn(typography.bodySmall, 'font-semibold')}>
                  {originalWeeksCount} Wochen
                </span>
              </div>
              <div className="flex justify-between">
                <span className={typography.bodySmall}>Angepasst:</span>
                <span
                  className={cn(
                    typography.bodySmall,
                    'font-semibold',
                    newWeeksCount < originalWeeksCount
                      ? 'text-orange-600'
                      : newWeeksCount > originalWeeksCount
                      ? 'text-green-600'
                      : 'text-gray-700'
                  )}
                >
                  {newWeeksCount} Wochen
                </span>
              </div>
            </div>
            {newWeeksCount !== originalWeeksCount && (
              <p className={cn(typography.bodySmall, 'text-text-tertiary mt-2')}>
                {newWeeksCount < originalWeeksCount
                  ? '⚠️ Der angepasste Plan ist kürzer. Einheiten werden komprimiert.'
                  : '✓ Der angepasste Plan ist länger. Einheiten werden gestreckt.'}
              </p>
            )}
          </div>
        )}

        {/* Additional Info */}
        <div className="border-t border-gray-200 pt-4">
          <p className={cn(typography.bodySmall, 'text-text-tertiary')}>
            <strong>Hinweis:</strong> Nach dem Kopieren kannst du den Plan in deinem Dashboard
            weiter bearbeiten und an deine Bedürfnisse anpassen.
          </p>
        </div>
      </div>
    </Modal>
  );
}
