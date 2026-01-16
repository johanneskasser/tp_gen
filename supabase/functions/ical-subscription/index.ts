import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrainingPlan {
  event: {
    name: string;
    date: string;
    distance: string;
    customDistance?: number;
    terrain: string;
    targetTime?: string;
  };
  startDate: string;
  weeks: Array<{
    weekNumber: number;
    startDate: string;
    endDate: string;
    sessions: Array<{
      id: string;
      dayOfWeek: number;
      type: string;
      distance?: number;
      duration?: number;
      intervals?: Array<{
        distance: number;
        pace?: string;
        repetitions: number;
        recovery?: string;
        recoveryUnit?: string;
      }>;
      warmUp?: number;
      warmUpUnit?: string;
      coolDown?: number;
      coolDownUnit?: string;
      notes?: string;
      title: string;
      strides?: {
        count: number;
        duration: number;
        recovery: number;
      };
      hillRepeats?: {
        repetitions: number;
        distance?: number;
        duration?: number;
        recovery: number;
        grade?: number;
      };
      progression?: {
        startPace?: string;
        endPace?: string;
        totalDistance?: number;
      };
      fartlek?: Array<{
        type: string;
        duration: number;
        pace?: string;
      }>;
      exercises?: Array<{
        name: string;
        sets: number;
        reps: number;
        isTime?: boolean;
        restTime?: number;
      }>;
    }>;
    totalKm: number;
  }>;
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  easy: 'Locker',
  long: 'Langer Lauf',
  intervals: 'Intervall',
  tempo: 'Tempo',
  recovery: 'Erholung',
  race: 'Wettkampf',
  strides: 'Steigerungen',
  hill_repeats: 'Bergwiederholungen',
  progression: 'Progression Run',
  fartlek: 'Fartlek',
  strength: 'Krafttraining',
  plyometrics: 'Plyometrie',
};

function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function generateSessionDescription(session: any): string {
  let description = `Typ: ${SESSION_TYPE_LABELS[session.type] || session.type}\n`;

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
    session.intervals.forEach((interval: any, idx: number) => {
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
    session.fartlek.forEach((segment: any, idx: number) => {
      description += `  ${idx + 1}. ${segment.type} - ${segment.duration} min`;
      if (segment.pace) {
        description += ` @ ${segment.pace} min/km`;
      }
      description += '\n';
    });
  }

  if (session.exercises && session.exercises.length > 0) {
    description += '\nÜbungen:\n';
    session.exercises.forEach((exercise: any) => {
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

function getSessionStartTime(session: any): { hours: number; minutes: number } {
  switch (session.type) {
    case 'long':
      return { hours: 8, minutes: 0 };
    case 'intervals':
    case 'tempo':
    case 'hill_repeats':
      return { hours: 18, minutes: 0 };
    case 'race':
      return { hours: 9, minutes: 0 };
    default:
      return { hours: 6, minutes: 30 };
  }
}

function getSessionDuration(session: any): number {
  if (session.duration) {
    return session.duration;
  }

  let totalKm = session.distance || 0;

  if (session.warmUp && session.warmUpUnit === 'km') {
    totalKm += session.warmUp;
  }

  if (session.coolDown && session.coolDownUnit === 'km') {
    totalKm += session.coolDown;
  }

  if (session.intervals) {
    session.intervals.forEach((interval: any) => {
      totalKm += interval.distance * interval.repetitions;
      if (interval.recovery && interval.recoveryUnit === 'km') {
        totalKm += parseFloat(interval.recovery) * interval.repetitions;
      }
    });
  }

  const estimatedMinutes = totalKm * 6;

  if (session.warmUp && session.warmUpUnit === 'min') {
    return estimatedMinutes + session.warmUp + (session.coolDown && session.coolDownUnit === 'min' ? session.coolDown : 0);
  }

  return Math.min(Math.max(estimatedMinutes, 30), 180);
}

function generateICalContent(plan: TrainingPlan, planId: string): string {
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
    `X-PUBLISHED-TTL:PT1H`, // Refresh every hour
  ].join('\r\n');

  // Add race event
  const raceDate = new Date(plan.event.date + 'T00:00:00');
  const raceStart = new Date(raceDate);
  raceStart.setHours(9, 0, 0, 0);
  const raceEnd = new Date(raceStart);
  raceEnd.setHours(raceEnd.getHours() + 3);

  icalContent += '\r\n' + [
    'BEGIN:VEVENT',
    `UID:race-${plan.event.date}-${planId}@trainingsplan-generator`,
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
      const sessionDate = new Date(week.startDate);
      sessionDate.setDate(sessionDate.getDate() + session.dayOfWeek);

      const startTime = getSessionStartTime(session);
      const startDateTime = new Date(sessionDate);
      startDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);

      const duration = getSessionDuration(session);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);

      const description = generateSessionDescription(session);

      icalContent += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${session.id}-${planId}@trainingsplan-generator`,
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

  return icalContent;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get plan ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const planId = pathParts[pathParts.length - 1];

    if (!planId) {
      return new Response(
        JSON.stringify({ error: 'Plan ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key to bypass RLS
    // This is safe because we only return iCal data, no sensitive user info
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the training plan (bypasses RLS for iCal subscriptions)
    const { data: planData, error } = await supabase
      .from('training_plans')
      .select('plan_data, name')
      .eq('id', planId)
      .single();

    if (error || !planData) {
      return new Response(
        JSON.stringify({ error: 'Training plan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate iCal content
    const icalContent = generateICalContent(planData.plan_data, planId);

    // Return iCal file
    return new Response(icalContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${planData.name.replace(/[^a-z0-9]/gi, '_')}_Trainingsplan.ics"`,
        'Cache-Control': 'no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating iCal:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
