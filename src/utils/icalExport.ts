import { TrainingPlan, TrainingSession } from '../types';
import { getSessionTypeLabel } from '../constants/sessionTypes';

/**
 * Formats a date to iCal format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters for iCal format
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates a description for a training session
 */
function generateSessionDescription(session: TrainingSession): string {
  let description = `Typ: ${getSessionTypeLabel(session.type)}\n`;

  if (session.distance) {
    description += `Distanz: ${session.distance.toFixed(2)} km\n`;
  }

  if (session.duration) {
    description += `Dauer: ${session.duration} Minuten\n`;
  }

  if (session.warmUp) {
    description += `Aufwärmen: ${session.warmUp} ${session.warmUpUnit === 'km' ? 'km' : 'min'}\n`;
  }

  if (session.intervals && session.intervals.length > 0) {
    description += '\nIntervalle:\n';
    session.intervals.forEach((interval, idx) => {
      description += `  ${idx + 1}. ${interval.repetitions}x ${interval.distance}km`;
      if (interval.pace) {
        description += ` @ ${interval.pace} min/km`;
      }
      if (interval.recovery) {
        description += `, Pause: ${interval.recovery} ${interval.recoveryUnit === 'km' ? 'km' : 'min'}`;
      }
      description += '\n';
    });
  }

  if (session.strides) {
    description += `\nSteigerungen: ${session.strides.count}x ${session.strides.duration}s (Pause: ${session.strides.recovery}s)\n`;
  }

  if (session.hillRepeats) {
    description += `\nBergwiederholungen: ${session.hillRepeats.repetitions}x`;
    if (session.hillRepeats.distance) {
      description += ` ${session.hillRepeats.distance}km`;
    } else if (session.hillRepeats.duration) {
      description += ` ${session.hillRepeats.duration} min`;
    }
    if (session.hillRepeats.grade) {
      description += ` @ ${session.hillRepeats.grade}% Steigung`;
    }
    description += `, Pause: ${session.hillRepeats.recovery} min\n`;
  }

  if (session.progression) {
    description += '\nProgression Run:\n';
    if (session.progression.startPace) {
      description += `  Start: ${session.progression.startPace} min/km\n`;
    }
    if (session.progression.endPace) {
      description += `  Ende: ${session.progression.endPace} min/km\n`;
    }
    if (session.progression.totalDistance) {
      description += `  Distanz: ${session.progression.totalDistance}km\n`;
    }
  }

  if (session.fartlek && session.fartlek.length > 0) {
    description += '\nFartlek-Segmente:\n';
    session.fartlek.forEach((segment, idx) => {
      description += `  ${idx + 1}. ${segment.type} - ${segment.duration} min`;
      if (segment.pace) {
        description += ` @ ${segment.pace} min/km`;
      }
      description += '\n';
    });
  }

  if (session.exercises && session.exercises.length > 0) {
    description += '\nÜbungen:\n';
    session.exercises.forEach((exercise) => {
      description += `  ${exercise.name}: ${exercise.sets}x${exercise.reps}${exercise.isTime ? 's' : ''}`;
      if (exercise.restTime) {
        description += ` (Pause: ${exercise.restTime}s)`;
      }
      description += '\n';
    });
  }

  if (session.coolDown) {
    description += `\nAuslaufen: ${session.coolDown} ${session.coolDownUnit === 'km' ? 'km' : 'min'}\n`;
  }

  if (session.notes) {
    description += `\nNotizen: ${session.notes}\n`;
  }

  return description;
}

/**
 * Gets the start time for a training session
 * Default times based on session type (can be customized)
 */
function getSessionStartTime(session: TrainingSession): { hours: number; minutes: number } {
  // Default times for different session types
  switch (session.type) {
    case 'long':
      return { hours: 8, minutes: 0 }; // Sunday long runs in the morning
    case 'intervals':
    case 'tempo':
    case 'hill_repeats':
      return { hours: 18, minutes: 0 }; // Intense sessions in the evening
    case 'race':
      return { hours: 9, minutes: 0 }; // Race day morning
    default:
      return { hours: 6, minutes: 30 }; // Easy runs early morning
  }
}

/**
 * Gets the duration of a training session in minutes
 */
function getSessionDuration(session: TrainingSession): number {
  if (session.duration) {
    return session.duration;
  }

  // Estimate duration based on distance (assuming ~6:00 min/km average pace)
  let totalKm = session.distance || 0;

  if (session.warmUp && session.warmUpUnit === 'km') {
    totalKm += session.warmUp;
  }

  if (session.coolDown && session.coolDownUnit === 'km') {
    totalKm += session.coolDown;
  }

  if (session.intervals) {
    session.intervals.forEach((interval) => {
      totalKm += interval.distance * interval.repetitions;
      if (interval.recovery && interval.recoveryUnit === 'km') {
        totalKm += parseFloat(interval.recovery) * interval.repetitions;
      }
    });
  }

  // Estimate 6 min/km for running + extra time for intervals/recovery
  const estimatedMinutes = totalKm * 6;

  // Add time-based components
  if (session.warmUp && session.warmUpUnit === 'min') {
    return estimatedMinutes + session.warmUp + (session.coolDown && session.coolDownUnit === 'min' ? session.coolDown : 0);
  }

  // Default: at least 30 minutes, at most 180 minutes
  return Math.min(Math.max(estimatedMinutes, 30), 180);
}

/**
 * Exports a training plan as iCal file
 */
export function exportToICal(plan: TrainingPlan): void {
  const now = new Date();
  const dtstamp = formatICalDate(now);

  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trainingsplan Generator//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(plan.event.name)}`,
    'X-WR-TIMEZONE:Europe/Berlin',
    'X-WR-CALDESC:Trainingsplan generiert mit Trainingsplan Generator',
  ].join('\r\n');

  // Add race event
  const raceDate = new Date(plan.event.date + 'T00:00:00');
  const raceStart = new Date(raceDate);
  raceStart.setHours(9, 0, 0, 0); // Default race start time: 9:00 AM
  const raceEnd = new Date(raceStart);
  raceEnd.setHours(raceEnd.getHours() + 3); // Assume 3 hours for the race

  icalContent += '\r\n' + [
    'BEGIN:VEVENT',
    `UID:race-${plan.event.date}@trainingsplan-generator`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${formatICalDate(raceStart)}`,
    `DTEND:${formatICalDate(raceEnd)}`,
    `SUMMARY:${escapeICalText('🏁 ' + plan.event.name)}`,
    `DESCRIPTION:${escapeICalText('Wettkampftag!\n\nDistanz: ' + (plan.event.customDistance || plan.event.distance) + '\nTerrain: ' + (plan.event.terrain === 'road' ? 'Straße' : 'Trail') + (plan.event.targetTime ? '\nZielzeit: ' + plan.event.targetTime : ''))}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
  ].join('\r\n');

  // Add training sessions
  plan.weeks.forEach((week) => {
    week.sessions.forEach((session) => {
      // Calculate the date for this session
      const sessionDate = new Date(week.startDate);
      sessionDate.setDate(sessionDate.getDate() + session.dayOfWeek);

      // Set the time
      const startTime = getSessionStartTime(session);
      const startDateTime = new Date(sessionDate);
      startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);

      const duration = getSessionDuration(session);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);

      const description = generateSessionDescription(session);

      icalContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${session.id}@trainingsplan-generator`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${formatICalDate(startDateTime)}`,
        `DTEND:${formatICalDate(endDateTime)}`,
        `SUMMARY:${escapeICalText(session.title)}`,
        `DESCRIPTION:${escapeICalText(description)}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT',
      ].join('\r\n');
    });
  });

  icalContent += '\r\nEND:VCALENDAR';

  // Create and download the file
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${plan.event.name.replace(/[^a-z0-9]/gi, '_')}_Trainingsplan.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
