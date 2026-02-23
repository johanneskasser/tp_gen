import { TrainingWeek, TrainingSession, RaceEvent } from '../types';

// Sample race event
export const sampleEvent: RaceEvent = {
  name: 'Berlin Marathon',
  date: '2024-09-29',
  distance: 'M',
  customDistance: undefined,
  targetTime: '03:30:00',
  terrain: 'road',
  elevationGain: undefined,
};

// Sample training sessions
export const sampleSessions: TrainingSession[] = [
  {
    id: '1',
    dayOfWeek: 0,
    type: 'easy',
    distance: 8,
    title: 'Lockerer Dauerlauf',
  },
  {
    id: '2',
    dayOfWeek: 2,
    type: 'intervals',
    distance: 10,
    title: '5x1000m Intervalle',
    intervals: [
      {
        distance: 1,
        pace: '04:00',
        repetitions: 5,
        recovery: '2',
        recoveryUnit: 'min',
      },
    ],
    warmUp: 2,
    warmUpUnit: 'km',
    coolDown: 2,
    coolDownUnit: 'km',
  },
  {
    id: '3',
    dayOfWeek: 4,
    type: 'tempo',
    distance: 12,
    title: 'Tempodauerlauf',
  },
  {
    id: '4',
    dayOfWeek: 6,
    type: 'long',
    distance: 20,
    title: 'Langer Lauf',
  },
];

// Sample training weeks for chart
export const sampleWeeks: TrainingWeek[] = [
  {
    weekNumber: 1,
    startDate: '2024-06-03',
    endDate: '2024-06-09',
    totalKm: 35,
    sessions: [
      { id: '1-1', dayOfWeek: 0, type: 'easy', distance: 8, title: 'Lockerer Lauf' },
      { id: '1-2', dayOfWeek: 2, type: 'intervals', distance: 10, title: 'Intervalle' },
      { id: '1-3', dayOfWeek: 4, type: 'easy', distance: 7, title: 'Lockerer Lauf' },
      { id: '1-4', dayOfWeek: 6, type: 'long', distance: 10, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 2,
    startDate: '2024-06-10',
    endDate: '2024-06-16',
    totalKm: 40,
    sessions: [
      { id: '2-1', dayOfWeek: 0, type: 'easy', distance: 9, title: 'Lockerer Lauf' },
      { id: '2-2', dayOfWeek: 2, type: 'tempo', distance: 12, title: 'Tempodauerlauf' },
      { id: '2-3', dayOfWeek: 4, type: 'easy', distance: 7, title: 'Lockerer Lauf' },
      { id: '2-4', dayOfWeek: 6, type: 'long', distance: 12, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 3,
    startDate: '2024-06-17',
    endDate: '2024-06-23',
    totalKm: 45,
    sessions: [
      { id: '3-1', dayOfWeek: 0, type: 'easy', distance: 10, title: 'Lockerer Lauf' },
      { id: '3-2', dayOfWeek: 2, type: 'intervals', distance: 12, title: '6x800m' },
      { id: '3-3', dayOfWeek: 4, type: 'tempo', distance: 10, title: 'Tempodauerlauf' },
      { id: '3-4', dayOfWeek: 6, type: 'long', distance: 13, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 4,
    startDate: '2024-06-24',
    endDate: '2024-06-30',
    totalKm: 38,
    sessions: [
      { id: '4-1', dayOfWeek: 0, type: 'easy', distance: 8, title: 'Lockerer Lauf' },
      { id: '4-2', dayOfWeek: 2, type: 'recovery', distance: 6, title: 'Regeneration' },
      { id: '4-3', dayOfWeek: 4, type: 'tempo', distance: 10, title: 'Tempodauerlauf' },
      { id: '4-4', dayOfWeek: 6, type: 'long', distance: 14, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 5,
    startDate: '2024-07-01',
    endDate: '2024-07-07',
    totalKm: 50,
    sessions: [
      { id: '5-1', dayOfWeek: 0, type: 'easy', distance: 10, title: 'Lockerer Lauf' },
      { id: '5-2', dayOfWeek: 2, type: 'intervals', distance: 14, title: '8x1000m' },
      { id: '5-3', dayOfWeek: 4, type: 'tempo', distance: 12, title: 'Tempodauerlauf' },
      { id: '5-4', dayOfWeek: 6, type: 'long', distance: 14, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 6,
    startDate: '2024-07-08',
    endDate: '2024-07-14',
    totalKm: 52,
    sessions: [
      { id: '6-1', dayOfWeek: 0, type: 'easy', distance: 10, title: 'Lockerer Lauf' },
      { id: '6-2', dayOfWeek: 2, type: 'tempo', distance: 14, title: 'Tempodauerlauf' },
      { id: '6-3', dayOfWeek: 4, type: 'easy', distance: 8, title: 'Lockerer Lauf' },
      { id: '6-4', dayOfWeek: 6, type: 'long', distance: 20, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 7,
    startDate: '2024-07-15',
    endDate: '2024-07-21',
    totalKm: 55,
    sessions: [
      { id: '7-1', dayOfWeek: 0, type: 'easy', distance: 10, title: 'Lockerer Lauf' },
      { id: '7-2', dayOfWeek: 2, type: 'intervals', distance: 15, title: '10x800m' },
      { id: '7-3', dayOfWeek: 4, type: 'tempo', distance: 12, title: 'Tempodauerlauf' },
      { id: '7-4', dayOfWeek: 6, type: 'long', distance: 18, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 8,
    startDate: '2024-07-22',
    endDate: '2024-07-28',
    totalKm: 48,
    sessions: [
      { id: '8-1', dayOfWeek: 0, type: 'easy', distance: 9, title: 'Lockerer Lauf' },
      { id: '8-2', dayOfWeek: 2, type: 'tempo', distance: 12, title: 'Tempodauerlauf' },
      { id: '8-3', dayOfWeek: 4, type: 'recovery', distance: 7, title: 'Regeneration' },
      { id: '8-4', dayOfWeek: 6, type: 'long', distance: 20, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 9,
    startDate: '2024-07-29',
    endDate: '2024-08-04',
    totalKm: 45,
    sessions: [
      { id: '9-1', dayOfWeek: 0, type: 'easy', distance: 10, title: 'Lockerer Lauf' },
      { id: '9-2', dayOfWeek: 2, type: 'intervals', distance: 12, title: '6x1200m' },
      { id: '9-3', dayOfWeek: 4, type: 'easy', distance: 8, title: 'Lockerer Lauf' },
      { id: '9-4', dayOfWeek: 6, type: 'long', distance: 15, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 10,
    startDate: '2024-08-05',
    endDate: '2024-08-11',
    totalKm: 42,
    sessions: [
      { id: '10-1', dayOfWeek: 0, type: 'easy', distance: 8, title: 'Lockerer Lauf' },
      { id: '10-2', dayOfWeek: 2, type: 'tempo', distance: 12, title: 'Tempodauerlauf' },
      { id: '10-3', dayOfWeek: 4, type: 'easy', distance: 7, title: 'Lockerer Lauf' },
      { id: '10-4', dayOfWeek: 6, type: 'long', distance: 15, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 11,
    startDate: '2024-08-12',
    endDate: '2024-08-18',
    totalKm: 35,
    sessions: [
      { id: '11-1', dayOfWeek: 0, type: 'easy', distance: 8, title: 'Lockerer Lauf' },
      { id: '11-2', dayOfWeek: 2, type: 'recovery', distance: 6, title: 'Regeneration' },
      { id: '11-3', dayOfWeek: 4, type: 'easy', distance: 8, title: 'Lockerer Lauf' },
      { id: '11-4', dayOfWeek: 6, type: 'long', distance: 13, title: 'Langer Lauf' },
    ],
  },
  {
    weekNumber: 12,
    startDate: '2024-08-19',
    endDate: '2024-08-25',
    totalKm: 25,
    sessions: [
      { id: '12-1', dayOfWeek: 0, type: 'easy', distance: 6, title: 'Lockerer Lauf' },
      { id: '12-2', dayOfWeek: 2, type: 'recovery', distance: 5, title: 'Regeneration' },
      { id: '12-3', dayOfWeek: 4, type: 'easy', distance: 4, title: 'Lockerer Lauf' },
      { id: '12-4', dayOfWeek: 6, type: 'race', distance: 42.195, title: 'Marathon!' },
    ],
  },
];
