export type RaceDistance = '5K' | '10K' | 'HM' | 'M' | 'CUSTOM';
export type TerrainType = 'road' | 'trail';
export type SessionType = 'easy' | 'long' | 'intervals' | 'tempo' | 'recovery' | 'race';

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
}

export interface TrainingSession {
  id: string;
  dayOfWeek: number; // 0-6 (Montag-Sonntag)
  type: SessionType;
  distance?: number;
  duration?: number;
  intervals?: IntervalSet[];
  warmUp?: number;
  coolDown?: number;
  notes?: string;
  title: string;
}

export interface TrainingWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  sessions: TrainingSession[];
  totalKm: number;
}

export interface TrainingPlan {
  event: RaceEvent;
  startDate: string;
  weeks: TrainingWeek[];
}
