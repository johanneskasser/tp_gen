/**
 * CoachingInsight - Compact Status Banner
 *
 * Ultra-compact coaching overview that doesn't distract from main content.
 * Industrial/utilitarian design - data-dense, single-line status bar.
 */

import { useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Target,
  Flame,
  Route,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { TrainingPlan } from '../../types';
import { UserProfile } from '../../types/userProfile';
import { TrainingRuleEngine } from '../../expertSystem';
import { cn } from '../../lib/designSystem';

interface Props {
  plan: TrainingPlan;
  userProfile?: UserProfile;
  className?: string;
}

export function CoachingInsight({ plan, userProfile, className }: Props) {
  const analysis = useMemo(() => {
    const engine = new TrainingRuleEngine(plan, userProfile);

    let totalSessions = 0;
    let totalKm = 0;
    let wellPlacedSessions = 0;
    let tipCount = 0;

    for (const week of plan.weeks) {
      const weekAnalysis = engine.analyzeWeek(week);
      totalSessions += week.sessions.length;
      totalKm += week.totalKm;

      weekAnalysis.days.forEach((day, dayOfWeek) => {
        const sessionsOnDay = week.sessions.filter(s => s.dayOfWeek === dayOfWeek);
        if (sessionsOnDay.length > 0 && day.violations.length === 0) {
          wellPlacedSessions += sessionsOnDay.length;
        }
        tipCount += day.violations.length;
      });
    }

    const coachingScore = totalSessions > 0
      ? Math.round((wellPlacedSessions / totalSessions) * 100)
      : 100;

    let status: 'excellent' | 'good' | 'growing';
    let statusText: string;

    if (coachingScore >= 85 || tipCount === 0) {
      status = 'excellent';
      statusText = 'Optimal';
    } else if (coachingScore >= 60) {
      status = 'good';
      statusText = 'Gut';
    } else {
      status = 'growing';
      statusText = 'In Arbeit';
    }

    return {
      coachingScore,
      totalSessions,
      totalKm,
      tipCount,
      status,
      statusText,
    };
  }, [plan, userProfile]);

  const statusConfig = {
    excellent: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-700',
      lightBg: 'bg-emerald-50',
      icon: CheckCircle,
    },
    good: {
      bg: 'bg-amber-500',
      text: 'text-amber-700',
      lightBg: 'bg-amber-50',
      icon: TrendingUp,
    },
    growing: {
      bg: 'bg-sky-500',
      text: 'text-sky-700',
      lightBg: 'bg-sky-50',
      icon: Target,
    },
  };

  const config = statusConfig[analysis.status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg',
        'bg-stone-50 border border-stone-200/80',
        'text-sm',
        className
      )}
    >
      {/* Status indicator */}
      <div className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md',
        config.lightBg
      )}>
        <StatusIcon className={cn('w-3.5 h-3.5', config.text)} />
        <span className={cn('font-medium text-xs', config.text)}>
          {analysis.statusText}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-stone-200" />

      {/* Stats row */}
      <div className="flex items-center gap-4 text-stone-600">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-semibold tabular-nums">{analysis.totalSessions}</span>
          <span className="text-stone-400 text-xs">Einheiten</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Route className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-semibold tabular-nums">{Math.round(analysis.totalKm)}</span>
          <span className="text-stone-400 text-xs">km</span>
        </div>

        {analysis.tipCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold tabular-nums">{analysis.tipCount}</span>
            <span className="text-stone-400 text-xs">Tipps</span>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Attribution - ultra minimal */}
      <div className="hidden md:flex items-center gap-1 text-[10px] text-stone-400">
        <Sparkles className="w-3 h-3" />
        <span>Daniels • Pfitzinger • Hansons</span>
      </div>
    </div>
  );
}
