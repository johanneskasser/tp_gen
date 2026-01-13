import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedTrainingPlan } from '../services/trainingPlanService';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Share2,
  Eye,
  Globe,
  Lock,
  EyeOff,
  MoreHorizontal,
  ArrowUpDown,
  Calendar,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../components/ui';
import { Button, Card, Input } from '../components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TrainingPlansTableProps {
  plans: SavedTrainingPlan[];
  onDelete: (id: string, name: string) => void;
  onPublish: (id: string) => void;
  onSetActive: (id: string) => void;
  deletingId: string | null;
}

type SortField = 'name' | 'date' | 'updated' | 'distance';
type SortDirection = 'asc' | 'desc';

export function TrainingPlansTable({
  plans,
  onDelete,
  onPublish,
  onSetActive,
  deletingId,
}: TrainingPlansTableProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'de' ? de : enUS;

  const [searchQuery, setSearchQuery] = useState('');
  const [distanceFilter, setDistanceFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const getDistanceLabel = (plan: SavedTrainingPlan) => {
    const { distance, customDistance } = plan.plan_data.event;
    if (distance === 'CUSTOM' && customDistance) {
      return `${customDistance} km`;
    }
    return distance;
  };

  const getVisibilityIcon = (visibility: SavedTrainingPlan['visibility']) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-3.5 w-3.5" />;
      case 'public_anonymous':
        return <EyeOff className="h-3.5 w-3.5" />;
      case 'private':
      default:
        return <Lock className="h-3.5 w-3.5" />;
    }
  };

  const getVisibilityBadge = (visibility: SavedTrainingPlan['visibility']) => {
    return (
      <Badge variant="default" className="gap-1">
        {getVisibilityIcon(visibility)}
        {visibility === 'public'
          ? t('dashboard.visibility.public')
          : visibility === 'public_anonymous'
          ? t('dashboard.visibility.publicAnonymous')
          : t('dashboard.visibility.private')}
      </Badge>
    );
  };

  // Filter und Sort Logic
  const filteredAndSortedPlans = plans
    .filter((plan) => {
      const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDistance =
        distanceFilter === 'all' || plan.plan_data.event.distance === distanceFilter;
      const matchesVisibility =
        visibilityFilter === 'all' || plan.visibility === visibilityFilter;
      return matchesSearch && matchesDistance && matchesVisibility;
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'date':
          compareValue =
            new Date(a.plan_data.event.date).getTime() -
            new Date(b.plan_data.event.date).getTime();
          break;
        case 'updated':
          compareValue =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'distance':
          const distA = a.plan_data.event.customDistance || 0;
          const distB = b.plan_data.event.customDistance || 0;
          compareValue = distA - distB;
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 -ml-3 data-[state=open]:bg-accent"
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder={t('dashboard.searchPlans')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 sm:max-w-sm"
            leftIcon={<Edit className="h-4 w-4 text-slate-400" />}
          />
          <div className="flex gap-2 flex-wrap">
            <Select value={distanceFilter} onValueChange={setDistanceFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder={t('dashboard.filter.distance')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.filter.allDistances')}</SelectItem>
                <SelectItem value="5K">5K</SelectItem>
                <SelectItem value="10K">10K</SelectItem>
                <SelectItem value="HM">{t('dashboard.filter.halfMarathon')}</SelectItem>
                <SelectItem value="M">{t('dashboard.filter.marathon')}</SelectItem>
                <SelectItem value="CUSTOM">{t('dashboard.filter.custom')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder={t('dashboard.filter.visibility')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.filter.allVisibility')}</SelectItem>
                <SelectItem value="public">{t('dashboard.visibility.public')}</SelectItem>
                <SelectItem value="public_anonymous">
                  {t('dashboard.visibility.publicAnonymous')}
                </SelectItem>
                <SelectItem value="private">{t('dashboard.visibility.private')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card className="overflow-hidden bg-white shadow-lg border border-gray-200">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-gray-200">
                  <TableHead className="w-[300px]">
                    <SortButton field="name">{t('dashboard.table.name')}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="distance">{t('dashboard.table.distance')}</SortButton>
                  </TableHead>
                  <TableHead>
                    <SortButton field="date">{t('dashboard.table.eventDate')}</SortButton>
                  </TableHead>
                  <TableHead>{t('dashboard.table.weeks')}</TableHead>
                  <TableHead>{t('dashboard.table.visibility')}</TableHead>
                  <TableHead className="text-center">{t('dashboard.table.stats')}</TableHead>
                  <TableHead>
                    <SortButton field="updated">{t('dashboard.table.updated')}</SortButton>
                  </TableHead>
                  <TableHead className="text-right">{t('dashboard.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                      {t('dashboard.noPlanFound')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedPlans.map((plan, index) => (
                    <TableRow
                      key={plan.id}
                      className="cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-100"
                      onClick={() => navigate(`/plan/${plan.id}`)}
                      style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="font-semibold text-slate-900">{plan.name}</span>
                            <span className="text-xs text-slate-500">
                              {plan.plan_data.event.name}
                            </span>
                          </div>
                          {plan.is_active && (
                            <div className="flex-shrink-0" title={t('dashboard.stats.activePlan')}>
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                <Calendar className="h-3 w-3" />
                                <span className="text-xs font-medium">Aktiv</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge>{getDistanceLabel(plan)}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {format(new Date(plan.plan_data.event.date), 'dd. MMM yyyy', {
                          locale: dateLocale,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge>{plan.plan_data.weeks.length}</Badge>
                      </TableCell>
                      <TableCell>{getVisibilityBadge(plan.visibility)}</TableCell>
                      <TableCell>
                        {plan.visibility !== 'private' && (
                          <div className="flex gap-3 text-sm text-slate-500 justify-center">
                            <div className="flex items-center gap-1" title={t('dashboard.stats.views')}>
                              <Eye className="h-3.5 w-3.5" />
                              <span className="tabular-nums">{plan.view_count}</span>
                            </div>
                            <div className="flex items-center gap-1" title={t('dashboard.stats.clones')}>
                              <Share2 className="h-3.5 w-3.5" />
                              <span className="tabular-nums">{plan.clone_count}</span>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                        {format(new Date(plan.updated_at), 'dd.MM.yy', { locale: dateLocale })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('dashboard.openMenu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/plan/${plan.id}`);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onPublish(plan.id);
                            }}>
                              <Share2 className="mr-2 h-4 w-4" />
                              {plan.visibility !== 'private'
                                ? t('dashboard.managePublication')
                                : t('dashboard.publish')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              onSetActive(plan.id);
                            }}>
                              <Calendar className="mr-2 h-4 w-4" />
                              {plan.is_active
                                ? t('dashboard.stats.removeActive')
                                : t('dashboard.stats.setAsActive')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(plan.id, plan.name);
                              }}
                              disabled={deletingId === plan.id}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredAndSortedPlans.length === 0 ? (
          <Card className="p-8 text-center bg-white shadow-md">
            <p className="text-slate-500">{t('dashboard.noPlanFound')}</p>
          </Card>
        ) : (
          filteredAndSortedPlans.map((plan, index) => (
            <div
              key={plan.id}
              style={{ animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` }}
            >
              <Card
                className="p-4 cursor-pointer hover:shadow-lg transition-all bg-white border border-gray-200"
                onClick={() => navigate(`/plan/${plan.id}`)}
              >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.plan_data.event.name}</p>
                  </div>
                  {plan.is_active && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full flex-shrink-0">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs font-medium">Aktiv</span>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">{t('dashboard.table.distance')}</span>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {getDistanceLabel(plan)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">{t('dashboard.table.eventDate')}</span>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {format(new Date(plan.plan_data.event.date), 'dd. MMM yy', {
                        locale: dateLocale,
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">{t('dashboard.table.weeks')}</span>
                    <div className="font-semibold text-slate-900 mt-0.5">
                      {plan.plan_data.weeks.length}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">{t('dashboard.table.visibility')}</span>
                    <div className="mt-0.5">{getVisibilityBadge(plan.visibility)}</div>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  {plan.visibility !== 'private' ? (
                    <div className="flex gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{plan.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{plan.clone_count}</span>
                      </div>
                    </div>
                  ) : (
                    <div />
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/plan/${plan.id}`);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onPublish(plan.id);
                      }}>
                        <Share2 className="mr-2 h-4 w-4" />
                        {plan.visibility !== 'private'
                          ? t('dashboard.managePublication')
                          : t('dashboard.publish')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onSetActive(plan.id);
                      }}>
                        <Calendar className="mr-2 h-4 w-4" />
                        {plan.is_active
                          ? t('dashboard.stats.removeActive')
                          : t('dashboard.stats.setAsActive')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(plan.id, plan.name);
                        }}
                        disabled={deletingId === plan.id}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              </Card>
            </div>
          ))
        )}
      </div>

      {/* Results Info */}
      {filteredAndSortedPlans.length > 0 && (
        <div className="text-sm text-slate-500 text-center lg:text-left">
          {t('dashboard.showingResults', {
            count: filteredAndSortedPlans.length,
            total: plans.length,
          })}
        </div>
      )}
    </div>
  );
}
