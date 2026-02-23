export type RaceDistance = '5K' | '10K' | 'HM' | 'M' | 'CUSTOM';
export type TerrainType = 'road' | 'trail';
export type SessionType =
  | 'easy'
  | 'long'
  | 'intervals'
  | 'tempo'
  | 'recovery'
  | 'race'
  | 'strides'        // Steigerungen - kurze Sprints am Ende von Easy Runs
  | 'hill_repeats'   // Bergwiederholungen für Kraft und Technik
  | 'progression'    // Progression Run - von easy zu zügig
  | 'fartlek'        // Fartlek - spielerische Tempowechsel
  | 'strength'       // Krafttraining
  | 'plyometrics';   // Plyometrie - Sprünge, Hops, Bounds
export type DistanceUnit = 'km' | 'min';

export interface RaceEvent {
  name: string;
  date: string;
  distance: RaceDistance;
  customDistance?: number;
  terrain: TerrainType;
  elevationGain?: number;
  targetTime?: string; // Format: HH:MM:SS or MM:SS
}

export interface IntervalSet {
  distance: number;
  pace?: string;
  repetitions: number;
  recovery?: string;
  recoveryUnit?: DistanceUnit;
}

// Für Strides (Steigerungen)
export interface StrideSet {
  count: number; // Anzahl der Steigerungen (4-8)
  duration: number; // Dauer pro Stride in Sekunden (10-20s)
  recovery: number; // Pause zwischen Strides in Sekunden
}

// Für Hill Repeats (Bergwiederholungen)
export interface HillRepeatSet {
  repetitions: number;
  distance?: number; // in km
  duration?: number; // in Minuten
  recovery: number; // Pause in Minuten
  grade?: number; // Steigung in % (optional)
}

// Für Progression Run
export interface ProgressionData {
  startPace?: string; // Format: "5:30"
  endPace?: string; // Format: "4:00"
  totalDistance?: number;
}

// Für Fartlek (flexible Tempowechsel)
export interface FartlekSegment {
  type: 'easy' | 'tempo' | 'fast';
  duration: number; // in Minuten
  pace?: string;
}

// Für Krafttraining und Plyometrie
export interface Exercise {
  name: string;
  sets: number;
  reps: number; // oder Zeit in Sekunden
  isTime?: boolean; // true wenn reps = Zeit in Sekunden
  restTime?: number; // Pause zwischen Sätzen in Sekunden
}

export interface TrainingSession {
  id: string;
  dayOfWeek: number; // 0-6 (Montag-Sonntag)
  type: SessionType;
  distance?: number;
  duration?: number;
  intervals?: IntervalSet[];
  warmUp?: number;
  warmUpUnit?: DistanceUnit;
  coolDown?: number;
  coolDownUnit?: DistanceUnit;
  notes?: string;
  title: string;

  // Spezifische Felder für neue Session-Typen
  strides?: StrideSet;
  hillRepeats?: HillRepeatSet;
  progression?: ProgressionData;
  fartlek?: FartlekSegment[];
  exercises?: Exercise[]; // Für strength und plyometrics
}

export interface TrainingWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions: TrainingSession[];
  totalKm: number;
  startDayOfWeek?: number; // 0 = Monday, 6 = Sunday
}

export interface TrainingPlan {
  event: RaceEvent;
  startDate: string;
  weeks: TrainingWeek[];
}
