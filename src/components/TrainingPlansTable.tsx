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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder={t('dashboard.searchPlans')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Select value={distanceFilter} onValueChange={setDistanceFilter}>
            <SelectTrigger className="w-[140px]">
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
            <SelectTrigger className="w-[140px]">
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

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={8} className="h-24 text-center">
                    {t('dashboard.noPlanFound')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedPlans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/plan/${plan.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="font-semibold">{plan.name}</span>
                          <span className="text-xs text-muted-foreground">
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
                    <TableCell className="whitespace-nowrap">
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
                        <div className="flex gap-3 text-sm text-muted-foreground justify-center">
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
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(plan.updated_at), 'dd.MM.yy', { locale: dateLocale })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0">
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

      {/* Results Info */}
      {filteredAndSortedPlans.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {t('dashboard.showingResults', {
            count: filteredAndSortedPlans.length,
            total: plans.length,
          })}
        </div>
      )}
    </div>
  );
}
