import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatPace } from '../../expertSystem/vdotPaceCalculator';
import { TrainingZones } from '../../types/userProfile';
import { PaceZoneKey, ZONE_LABEL_KEY, ZONE_COLOR } from './PaceZoneHint';

interface PaceZonePanelProps {
  zones: TrainingZones | null;
  recommendedZone: PaceZoneKey | null;
}

// TrainingZones structure:
// easy/recovery: { min: number; max: number } — ranges
// marathon/threshold/interval/repetition: number — single values
const ZONE_ROWS: { key: PaceZoneKey; getValue: (z: TrainingZones) => string }[] = [
  { key: 'recovery',   getValue: z => `${formatPace(z.recovery.min)} – ${formatPace(z.recovery.max)} /km` },
  { key: 'easy',       getValue: z => `${formatPace(z.easy.min)} – ${formatPace(z.easy.max)} /km` },
  { key: 'marathon',   getValue: z => `${formatPace(z.marathon)} /km` },
  { key: 'threshold',  getValue: z => `${formatPace(z.threshold)} /km` },
  { key: 'interval',   getValue: z => `${formatPace(z.interval)} /km` },
  { key: 'repetition', getValue: z => `${formatPace(z.repetition)} /km` },
];

export function PaceZonePanel({ zones, recommendedZone }: PaceZonePanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!zones) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {open ? t('paceZones.hideAll') : t('paceZones.showAll')}
      </button>
      {open && (
        <div className="mt-2 border rounded-lg overflow-hidden text-sm">
          {ZONE_ROWS.map(row => (
            <div
              key={row.key}
              className={`flex justify-between items-center px-3 py-2 ${
                row.key === recommendedZone
                  ? ZONE_COLOR[row.key] + ' font-semibold'
                  : 'bg-white'
              }`}
            >
              <span>{t(ZONE_LABEL_KEY[row.key])}</span>
              <span className="font-mono text-xs">{row.getValue(zones)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
