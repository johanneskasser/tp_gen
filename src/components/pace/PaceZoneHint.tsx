import { useTranslation } from 'react-i18next';
import { formatPace } from '../../expertSystem/vdotPaceCalculator';
import { TrainingZones } from '../../types/userProfile';

export type PaceZoneKey = 'recovery' | 'easy' | 'marathon' | 'threshold' | 'interval' | 'repetition';

export function getRecommendedZone(distanceKm: number): PaceZoneKey {
  if (distanceKm < 0.4) return 'repetition';
  if (distanceKm < 1.2) return 'interval';
  if (distanceKm < 3.0) return 'threshold';
  return 'marathon';
}

export const ZONE_LABEL_KEY: Record<PaceZoneKey, string> = {
  recovery:   'paceZones.recovery',
  easy:       'paceZones.easy',
  marathon:   'paceZones.marathon',
  threshold:  'paceZones.threshold',
  interval:   'paceZones.interval',
  repetition: 'paceZones.repetition',
};

export const ZONE_COLOR: Record<PaceZoneKey, string> = {
  recovery:   'bg-gray-100 text-gray-700',
  easy:       'bg-green-100 text-green-700',
  marathon:   'bg-blue-100 text-blue-700',
  threshold:  'bg-orange-100 text-orange-700',
  interval:   'bg-red-100 text-red-700',
  repetition: 'bg-purple-100 text-purple-700',
};

// TrainingZones structure:
// easy: { min: number; max: number }   — range
// recovery: { min: number; max: number } — range
// marathon: number                     — single value
// threshold: number                    — single value
// interval: number                     — single value
// repetition: number                   — single value
export function getPaceForZone(zones: TrainingZones, zone: PaceZoneKey): string {
  switch (zone) {
    case 'recovery':   return `${formatPace(zones.recovery.min)} – ${formatPace(zones.recovery.max)}`;
    case 'easy':       return `${formatPace(zones.easy.min)} – ${formatPace(zones.easy.max)}`;
    case 'marathon':   return formatPace(zones.marathon);
    case 'threshold':  return formatPace(zones.threshold);
    case 'interval':   return formatPace(zones.interval);
    case 'repetition': return formatPace(zones.repetition);
  }
}

interface PaceZoneHintProps {
  distanceKm: number | null;
  zones: TrainingZones | null;
  loading?: boolean;
}

export function PaceZoneHint({ distanceKm, zones, loading }: PaceZoneHintProps) {
  const { t } = useTranslation();

  if (loading) {
    return <div className="text-xs text-gray-400 mt-1">...</div>;
  }

  if (!zones) {
    return (
      <div className="text-xs text-gray-400 mt-1">
        {t('paceZones.noVdot')}
      </div>
    );
  }

  if (!distanceKm || distanceKm <= 0) return null;

  const zone = getRecommendedZone(distanceKm);
  const paceDisplay = getPaceForZone(zones, zone);

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${ZONE_COLOR[zone]}`}>
      <span>{t('paceZones.recommended')}:</span>
      <span>{t(ZONE_LABEL_KEY[zone])}</span>
      <span>{paceDisplay} /km</span>
    </div>
  );
}
