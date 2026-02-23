/**
 * CompactPlanHeader - Kompakter Sticky-Header für den PlanEditor
 *
 * Vereint alle Header-Informationen in einer dichten, aber übersichtlichen Zeile:
 * - Navigation (Zurück)
 * - Plan-Name + Info-Popover mit Event-Details
 * - Kompakte Event-Stats (Distanz, Pace)
 * - Save-Status mit Tooltip
 * - Coaching-Stats (Einheiten, km) mit Tooltips
 * - Difficulty-Badge mit Tooltip
 * - Action-Buttons
 *
 * Sticky unter dem PageHeader (top-[72px])
 */

import { useMemo } from 'react';
import { TrainingPlan } from '../types';
import { UserProfile } from '../types/userProfile';
import { SavedTrainingPlan } from '../services/trainingPlanService';
import { Button } from './ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  ArrowLeft,
  Info,
  Save,
  Loader2,
  Share2,
  Download,
  FileDown,
  Calendar,
  Flame,
  Route,
  MoreHorizontal,
  Pencil,
  Clock,
  Copy,
} from 'lucide-react';
import { calculatePace, formatPace } from '../utils/paceCalculator';
import { getRaceDistanceKm, calculateSessionDistance } from '../utils/calculationUtils';
import { calculatePlanDifficulty, getDifficultyDisplay } from '../utils/personalizedIntensity';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Props {
  plan: TrainingPlan;
  savedPlan: SavedTrainingPlan | null;
  saving: boolean;
  lastSaved: Date | null;
  runnerProfile: UserProfile | null;
  onBack: () => void;
  onPublish: () => void;
  onEditEvent: () => void;
  onExportJSON: () => void;
  onExportFIT: () => void;
  onExportICal: () => void;
  onExportPDF: () => void;
  onShowSubscription: () => void;
  onCopyPlan: () => void;
}

export function CompactPlanHeader({
  plan,
  savedPlan,
  saving,
  lastSaved,
  runnerProfile,
  onBack,
  onPublish,
  onEditEvent,
  onExportJSON,
  onExportFIT,
  onExportICal,
  onExportPDF,
  onShowSubscription,
  onCopyPlan,
}: Props) {
  // Calculate coaching stats
  const stats = useMemo(() => {
    let totalSessions = 0;
    let totalKm = 0;

    for (const week of plan.weeks) {
      totalSessions += week.sessions.length;
      for (const session of week.sessions) {
        totalKm += calculateSessionDistance(session);
      }
    }

    const avgKmPerWeek = plan.weeks.length > 0 ? totalKm / plan.weeks.length : 0;

    return {
      totalSessions,
      totalKm: Math.round(totalKm),
      avgKmPerWeek: avgKmPerWeek.toFixed(1),
    };
  }, [plan]);

  // Calculate difficulty if profile exists
  const difficulty = useMemo(() => {
    if (!runnerProfile || (runnerProfile.personalBests.length === 0 && !runnerProfile.weeklyKmBase)) {
      return null;
    }
    const result = calculatePlanDifficulty(plan, runnerProfile);
    return {
      score: result.score,
      display: getDifficultyDisplay(result.overall),
      label: result.overall,
    };
  }, [plan, runnerProfile]);

  // Format distance display
  const distanceDisplay = plan.event.distance === 'CUSTOM'
    ? `${plan.event.customDistance} km`
    : plan.event.distance;

  // Calculate pace if target time exists
  const paceDisplay = plan.event.targetTime
    ? formatPace(
        calculatePace(
          plan.event.targetTime,
          getRaceDistanceKm(plan.event.distance, plan.event.customDistance)
        )
      )
    : null;

  // Save status tooltip text
  const getSaveTooltip = () => {
    if (saving) return 'Speichert...';
    if (!lastSaved) return 'Noch nicht gespeichert';
    const secondsAgo = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
    if (secondsAgo < 10) return 'Gerade gespeichert';
    return `Gespeichert ${formatDistanceToNow(lastSaved, { addSuffix: true, locale: de })}`;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="sticky top-[72px] z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 max-w-7xl mx-auto">
          {/* Back Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onBack}
                variant="ghost"
                size="sm"
                className="px-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">Zurück</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zurück zum Dashboard</TooltipContent>
          </Tooltip>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200" />

          {/* Plan Name + Info Popover */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="font-semibold text-sm text-slate-800 truncate max-w-[180px] lg:max-w-[280px]">
              {plan.event.name}
            </h1>
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button className="p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Event-Details anzeigen</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-64 p-3" align="start">
                <h3 className="font-semibold text-sm text-slate-800 mb-2">Event-Details</h3>
                <dl className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Distanz</dt>
                    <dd className="text-slate-700 font-medium">{distanceDisplay}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Terrain</dt>
                    <dd className="text-slate-700">{plan.event.terrain === 'road' ? 'Straße' : 'Trail'}</dd>
                  </div>
                  {plan.event.terrain === 'trail' && plan.event.elevationGain && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Höhenmeter</dt>
                      <dd className="text-slate-700">{plan.event.elevationGain} HM</dd>
                    </div>
                  )}
                  {plan.event.targetTime && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Zielzeit</dt>
                      <dd className="text-slate-700 font-medium">{plan.event.targetTime}</dd>
                    </div>
                  )}
                  {paceDisplay && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Zielpace</dt>
                      <dd className="text-slate-700">{paceDisplay}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Trainingswochen</dt>
                    <dd className="text-slate-700">{plan.weeks.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Trainingsstart</dt>
                    <dd className="text-slate-700">{format(new Date(plan.startDate), 'dd.MM.yyyy', { locale: de })}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Event-Datum</dt>
                    <dd className="text-slate-700 font-medium">{format(new Date(plan.event.date), 'dd.MM.yyyy', { locale: de })}</dd>
                  </div>
                </dl>
              </PopoverContent>
            </Popover>
          </div>

          {/* Enhanced Event Stats */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 cursor-default">
                <span>{distanceDisplay}</span>
                {paceDisplay && (
                  <>
                    <span>•</span>
                    <span>{paceDisplay}</span>
                  </>
                )}
                <span>•</span>
                <span>{plan.weeks.length} wo</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {plan.event.distance === 'CUSTOM' ? 'Eigene Distanz' : plan.event.distance}
              {paceDisplay && ` mit Zielpace ${paceDisplay}`}
              {' • '}{plan.weeks.length} Trainingswochen
            </TooltipContent>
          </Tooltip>

          {/* Save Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-xs text-slate-400 cursor-default">
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : lastSaved ? (
                  <Save className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>{getSaveTooltip()}</TooltipContent>
          </Tooltip>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Consolidated Stats Badge */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-slate-600 cursor-default">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="font-medium tabular-nums">{stats.totalSessions}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Gesamtanzahl der Trainingseinheiten im Plan
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-3 bg-slate-300" />

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-slate-600 cursor-default">
                  <Route className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-medium tabular-nums">{stats.totalKm}</span>
                  <span className="text-slate-400">km</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Gesamtkilometer: {stats.totalKm} km<br />
                Durchschnitt: {stats.avgKmPerWeek} km/Woche
              </TooltipContent>
            </Tooltip>

            {difficulty && (
              <>
                <div className="w-px h-3 bg-slate-300" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-default">
                      <span>{difficulty.display.emoji}</span>
                      <span className={`font-medium tabular-nums ${difficulty.display.color}`}>
                        {difficulty.score}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <div className="font-medium">{difficulty.display.label}</div>
                    <div className="text-slate-300 mt-0.5">
                      Score: {difficulty.score}/100<br />
                      Basierend auf deinem Fitnesslevel
                    </div>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs px-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Weitere Aktionen</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={onCopyPlan}>
                <Copy className="w-4 h-4 mr-2" />
                Plan kopieren
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {savedPlan && (
                <>
                  <DropdownMenuItem onClick={onPublish}>
                    <Share2 className="w-4 h-4 mr-2" />
                    {savedPlan.visibility !== 'private' ? 'Veröffentlichung bearbeiten' : 'Veröffentlichen'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onClick={onEditEvent}>
                <Pencil className="w-4 h-4 mr-2" />
                Event bearbeiten
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onExportJSON}>
                <Download className="w-4 h-4 mr-2" />
                JSON exportieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportFIT}>
                <Download className="w-4 h-4 mr-2" />
                FIT exportieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportICal}>
                <Calendar className="w-4 h-4 mr-2" />
                iCal exportieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                PDF exportieren
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onShowSubscription}>
                <Calendar className="w-4 h-4 mr-2" />
                Kalender-Abonnement...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Layout - Two Rows */}
        <div className="sm:hidden">
          {/* Row 1: Navigation + Name + Actions */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="px-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            <h1 className="font-semibold text-sm text-slate-800 truncate flex-1">
              {plan.event.name}
            </h1>

            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 rounded hover:bg-slate-100">
                  <Info className="w-4 h-4 text-slate-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <h3 className="font-semibold text-sm text-slate-800 mb-2">Event-Details</h3>
                <dl className="text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Distanz</dt>
                    <dd className="text-slate-700 font-medium">{distanceDisplay}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Terrain</dt>
                    <dd className="text-slate-700">{plan.event.terrain === 'road' ? 'Straße' : 'Trail'}</dd>
                  </div>
                  {plan.event.targetTime && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Zielzeit</dt>
                      <dd className="text-slate-700 font-medium">{plan.event.targetTime}</dd>
                    </div>
                  )}
                  {paceDisplay && (
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Zielpace</dt>
                      <dd className="text-slate-700">{paceDisplay}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Trainingswochen</dt>
                    <dd className="text-slate-700">{plan.weeks.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Event-Datum</dt>
                    <dd className="text-slate-700">{format(new Date(plan.event.date), 'dd.MM.yy', { locale: de })}</dd>
                  </div>
                </dl>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-1">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  ) : lastSaved ? (
                    <Save className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>{getSaveTooltip()}</TooltipContent>
            </Tooltip>

            {/* Copy Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onCopyPlan} variant="default" size="sm" className="px-2">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Plan kopieren</TooltipContent>
            </Tooltip>

            {/* Mobile More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-1.5">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {savedPlan && (
                  <>
                    <DropdownMenuItem onClick={onPublish}>
                      <Share2 className="w-4 h-4 mr-2" />
                      {savedPlan.visibility !== 'private' ? 'Veröffentlichung bearbeiten' : 'Veröffentlichen'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={onEditEvent}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Event bearbeiten
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExportJSON}>
                  <Download className="w-4 h-4 mr-2" />
                  JSON exportieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportFIT}>
                  <Download className="w-4 h-4 mr-2" />
                  FIT exportieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportICal}>
                  <Calendar className="w-4 h-4 mr-2" />
                  iCal exportieren
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPDF}>
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF exportieren
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onShowSubscription}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Kalender-Abonnement...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 2: Consolidated Stats + Distance/Pace */}
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
            {/* Consolidated stats with bullets */}
            <div className="flex items-center gap-2 text-slate-600">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-default">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="font-medium tabular-nums">{stats.totalSessions}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{stats.totalSessions} Trainingseinheiten</TooltipContent>
              </Tooltip>

              <span className="text-slate-300">•</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-default">
                    <Route className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium tabular-nums">{stats.totalKm}</span>
                    <span className="text-slate-400">km</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Gesamt: {stats.totalKm} km<br />
                  Ø {stats.avgKmPerWeek} km/Woche
                </TooltipContent>
              </Tooltip>

              {difficulty && (
                <>
                  <span className="text-slate-300">•</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-default">
                        <span>{difficulty.display.emoji}</span>
                        <span className={`font-medium tabular-nums ${difficulty.display.color}`}>
                          {difficulty.score}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="font-medium">{difficulty.display.label}</div>
                      <div className="text-slate-300">Score: {difficulty.score}/100</div>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>

            <div className="flex-1" />

            {/* Distance + Pace on mobile */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>{distanceDisplay}</span>
              {paceDisplay && (
                <>
                  <span>•</span>
                  <span>{paceDisplay}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
