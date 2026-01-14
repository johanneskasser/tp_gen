import { Encoder, Stream, Decoder } from '@garmin/fitsdk';
import { TrainingPlan, TrainingSession, SessionType, IntervalSet } from '../types';

/**
 * Maps our SessionType to FIT workout step intensity
 */
function mapSessionTypeToIntensity(type: SessionType): number {
  // FIT intensity values: 0=active, 1=rest, 2=warmup, 3=cooldown, 4=recovery, 5=interval, 6=other
  switch (type) {
    case 'recovery':
      return 4; // recovery
    case 'easy':
      return 0; // active
    case 'long':
      return 0; // active
    case 'tempo':
      return 5; // interval (for structured tempo)
    case 'intervals':
      return 5; // interval
    case 'race':
      return 0; // active
    case 'strides':
      return 5; // interval
    case 'hill_repeats':
      return 5; // interval
    case 'progression':
      return 0; // active
    case 'fartlek':
      return 5; // interval
    case 'strength':
      return 6; // other
    case 'plyometrics':
      return 6; // other
    default:
      return 0; // active
  }
}

/**
 * Maps our SessionType to FIT workout step target type
 */
function mapSessionTypeToTargetType(type: SessionType): number {
  // FIT target_type: 0=speed, 1=heart_rate, 2=open, 3=cadence, 4=power
  switch (type) {
    case 'recovery':
    case 'easy':
    case 'long':
      return 2; // open (no specific target)
    case 'tempo':
    case 'intervals':
      return 0; // speed target
    case 'race':
      return 0; // speed target
    default:
      return 2; // open
  }
}

/**
 * Convert pace string (MM:SS) to speed in m/s
 */
function paceToSpeed(pace?: string): number | undefined {
  if (!pace) return undefined;

  const parts = pace.split(':');
  if (parts.length !== 2) return undefined;

  const minutes = parseInt(parts[0]);
  const seconds = parseInt(parts[1]);
  const totalSeconds = minutes * 60 + seconds;

  if (totalSeconds === 0) return undefined;

  // Convert min/km to m/s: 1000m / totalSeconds
  return 1000 / totalSeconds;
}

/**
 * Exports a training plan as FIT workout file
 */
export function exportToFIT(plan: TrainingPlan): void {
  const encoder = new Encoder(Stream.toBuffer());

  const timestamp = new Date();

  // FILE_ID message (required for all FIT files)
  encoder.writeFileId({
    type: 'workout',
    manufacturer: 'development',
    product: 0,
    timeCreated: timestamp,
    serialNumber: Math.floor(Math.random() * 0xFFFFFFFF)
  });

  // Create one workout per week (FIT workouts are typically single sessions)
  // For a training plan with multiple sessions per week, we'll create multiple workouts
  let workoutIndex = 0;

  for (const week of plan.weeks) {
    for (const session of week.sessions) {
      workoutIndex++;

      // WORKOUT message
      encoder.writeWorkout({
        workoutName: `${plan.event.name} - W${week.weekNumber} - ${session.title}`,
        sport: 'running',
        numValidSteps: 0 // Will be calculated
      });

      let stepIndex = 0;
      const steps: any[] = [];

      // Add warm-up step if present
      if (session.warmUp && session.warmUp > 0) {
        const warmUpStep = {
          messageIndex: stepIndex++,
          workoutStepName: 'Aufwärmen',
          intensity: 2, // warmup
          durationType: session.warmUpUnit === 'km' ? 'distance' : 'time',
          durationValue: session.warmUpUnit === 'km'
            ? session.warmUp * 1000 * 100 // convert km to cm
            : session.warmUp * 60 * 1000, // convert min to ms
          targetType: 2 // open
        };
        steps.push(warmUpStep);
      }

      // Add main workout steps
      if (session.type === 'intervals' && session.intervals) {
        // Add interval steps
        for (const interval of session.intervals) {
          for (let rep = 0; rep < interval.repetitions; rep++) {
            // Work interval
            const workStep = {
              messageIndex: stepIndex++,
              workoutStepName: `Intervall ${interval.distance}km`,
              intensity: 5, // interval
              durationType: 'distance',
              durationValue: interval.distance * 1000 * 100, // km to cm
              targetType: interval.pace ? 0 : 2, // speed or open
              ...(interval.pace && {
                customTargetValueLow: paceToSpeed(interval.pace),
                customTargetValueHigh: paceToSpeed(interval.pace)
              })
            };
            steps.push(workStep);

            // Recovery interval
            if (interval.recovery) {
              const recoveryValue = parseFloat(interval.recovery);
              const recoveryStep = {
                messageIndex: stepIndex++,
                workoutStepName: 'Erholung',
                intensity: 4, // recovery
                durationType: interval.recoveryUnit === 'km' ? 'distance' : 'time',
                durationValue: interval.recoveryUnit === 'km'
                  ? recoveryValue * 1000 * 100 // km to cm
                  : recoveryValue * 60 * 1000, // min to ms
                targetType: 2 // open
              };
              steps.push(recoveryStep);
            }
          }
        }
      } else {
        // Single main step for non-interval sessions
        const mainStep: any = {
          messageIndex: stepIndex++,
          workoutStepName: session.title,
          intensity: mapSessionTypeToIntensity(session.type),
          targetType: mapSessionTypeToTargetType(session.type)
        };

        // Set duration
        if (session.distance) {
          mainStep.durationType = 'distance';
          mainStep.durationValue = session.distance * 1000 * 100; // km to cm
        } else if (session.duration) {
          mainStep.durationType = 'time';
          mainStep.durationValue = session.duration * 60 * 1000; // min to ms
        } else {
          mainStep.durationType = 'open';
          mainStep.durationValue = 0;
        }

        steps.push(mainStep);
      }

      // Add cool-down step if present
      if (session.coolDown && session.coolDown > 0) {
        const coolDownStep = {
          messageIndex: stepIndex++,
          workoutStepName: 'Auslaufen',
          intensity: 3, // cooldown
          durationType: session.coolDownUnit === 'km' ? 'distance' : 'time',
          durationValue: session.coolDownUnit === 'km'
            ? session.coolDown * 1000 * 100 // km to cm
            : session.coolDown * 60 * 1000, // min to ms
          targetType: 2 // open
        };
        steps.push(coolDownStep);
      }

      // Write all workout steps
      for (const step of steps) {
        encoder.writeWorkoutStep(step);
      }
    }
  }

  // Get the encoded buffer
  const buffer = encoder.finish();

  // Create blob and download
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${plan.event.name.replace(/[^a-z0-9]/gi, '_')}_Trainingsplan.fit`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert speed in m/s to pace string (MM:SS)
 */
function speedToPace(speedMs?: number): string | undefined {
  if (!speedMs || speedMs === 0) return undefined;

  // Convert m/s to min/km
  const secondsPerKm = 1000 / speedMs;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Imports a training plan from FIT workout file
 */
export function importFromFIT(file: File): Promise<TrainingPlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const stream = Stream.fromBuffer(new Uint8Array(arrayBuffer));
        const decoder = new Decoder(stream);

        if (!decoder.isFit()) {
          throw new Error('Keine gültige FIT-Datei');
        }

        if (!decoder.checkIntegrity()) {
          throw new Error('FIT-Datei ist beschädigt');
        }

        const { messages } = decoder.read();

        // Extract workout data
        const workouts = messages.workoutMesgs || [];
        const workoutSteps = messages.workoutStepMesgs || [];

        if (workouts.length === 0) {
          throw new Error('Keine Workouts in der FIT-Datei gefunden');
        }

        // For now, we'll import the first workout and try to reconstruct a basic plan
        const workout = workouts[0];
        const workoutName = workout.workoutName || 'Importierter Plan';

        // Group workout steps by workout
        const sessions: TrainingSession[] = [];

        // Parse workout steps
        let currentSession: Partial<TrainingSession> | null = null;
        const intervals: IntervalSet[] = [];
        let warmUp: number | undefined;
        let warmUpUnit: 'km' | 'min' | undefined;
        let coolDown: number | undefined;
        let coolDownUnit: 'km' | 'min' | undefined;

        for (const step of workoutSteps) {
          const intensity = step.intensity;
          const durationType = step.durationType;
          const durationValue = step.durationValue;

          if (durationValue === undefined) continue;

          // Warm-up
          if (intensity === 2) {
            if (durationType === 'distance') {
              warmUp = (durationValue / 100) / 1000; // cm to km
              warmUpUnit = 'km';
            } else if (durationType === 'time') {
              warmUp = durationValue / (60 * 1000); // ms to min
              warmUpUnit = 'min';
            }
          }
          // Cool-down
          else if (intensity === 3) {
            if (durationType === 'distance') {
              coolDown = (durationValue / 100) / 1000; // cm to km
              coolDownUnit = 'km';
            } else if (durationType === 'time') {
              coolDown = durationValue / (60 * 1000); // ms to min
              coolDownUnit = 'min';
            }
          }
          // Interval work or recovery
          else if (intensity === 5 || intensity === 4) {
            const interval: Partial<IntervalSet> = {
              repetitions: 1
            };

            if (durationType === 'distance') {
              interval.distance = (durationValue / 100) / 1000; // cm to km
            }

            // Check for pace targets
            if (step.customTargetValueLow) {
              interval.pace = speedToPace(step.customTargetValueLow);
            }

            if (intensity === 4 && intervals.length > 0) {
              // This is a recovery step, add it to the last interval
              const lastInterval = intervals[intervals.length - 1];
              if (durationType === 'distance') {
                lastInterval.recovery = ((durationValue / 100) / 1000).toString();
                lastInterval.recoveryUnit = 'km';
              } else if (durationType === 'time') {
                lastInterval.recovery = (durationValue / (60 * 1000)).toString();
                lastInterval.recoveryUnit = 'min';
              }
            } else if (interval.distance) {
              intervals.push(interval as IntervalSet);
            }
          }
          // Main work (active)
          else if (intensity === 0) {
            if (!currentSession) {
              currentSession = {
                id: crypto.randomUUID(),
                dayOfWeek: 0,
                type: 'easy',
                title: step.workoutStepName || 'Training'
              };
            }

            if (durationType === 'distance') {
              currentSession.distance = (durationValue / 100) / 1000; // cm to km
            } else if (durationType === 'time') {
              currentSession.duration = durationValue / (60 * 1000); // ms to min
            }
          }
        }

        // Build the session
        if (!currentSession) {
          currentSession = {
            id: crypto.randomUUID(),
            dayOfWeek: 0,
            type: 'easy',
            title: 'Training'
          };
        }

        if (intervals.length > 0) {
          currentSession.type = 'intervals';
          currentSession.intervals = intervals;
        }

        if (warmUp) {
          currentSession.warmUp = warmUp;
          currentSession.warmUpUnit = warmUpUnit;
        }

        if (coolDown) {
          currentSession.coolDown = coolDown;
          currentSession.coolDownUnit = coolDownUnit;
        }

        sessions.push(currentSession as TrainingSession);

        // Create a basic training plan structure
        const plan: TrainingPlan = {
          event: {
            name: workoutName.split(' - ')[0] || 'Importierter Plan',
            date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
            distance: 'CUSTOM',
            terrain: 'road'
          },
          startDate: new Date().toISOString().split('T')[0],
          weeks: [
            {
              weekNumber: 1,
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              sessions: sessions,
              totalKm: sessions.reduce((sum, s) => sum + (s.distance || 0), 0)
            }
          ]
        };

        resolve(plan);
      } catch (error) {
        reject(new Error('Fehler beim Laden der FIT-Datei: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };

    reader.readAsArrayBuffer(file);
  });
}
