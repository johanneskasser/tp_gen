import { addDays, differenceInWeeks, format, getDay } from 'date-fns';

export function calculateWeeks(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate number of weeks
  const numberOfWeeks = differenceInWeeks(end, start) + 1;

  const weeks = [];
  for (let i = 0; i < numberOfWeeks; i++) {
    const weekStart = addDays(start, i * 7);
    const weekEnd = addDays(weekStart, 6);

    weeks.push({
      weekNumber: i + 1,
      startDate: format(weekStart, 'yyyy-MM-dd'),
      endDate: format(weekEnd, 'yyyy-MM-dd'),
      displayStart: format(weekStart, 'dd.MM.yyyy'),
      displayEnd: format(weekEnd, 'dd.MM.yyyy'),
      startDayOfWeek: getISODayOfWeek(weekStart),
    });
  }

  return weeks;
}

/**
 * Get ISO day of week (0 = Monday, 6 = Sunday)
 * date-fns getDay returns 0 = Sunday, 1 = Monday, etc.
 */
function getISODayOfWeek(date: Date): number {
  const day = getDay(date);
  // Convert Sunday (0) to 6, and shift others down by 1
  return day === 0 ? 6 : day - 1;
}

export function formatDate(date: string): string {
  return format(new Date(date), 'dd.MM.yyyy');
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  return days[dayOfWeek];
}
