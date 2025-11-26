import { TrainingPlan } from '../types';
import { PlanVisibility } from './database';
import { UserProfile } from './profile';

// Extended training plan with marketplace metadata
export interface MarketplacePlan {
  id: string;
  user_id: string;
  name: string;
  plan_data: TrainingPlan;
  created_at: string;
  updated_at: string;
  visibility: PlanVisibility;
  description: string | null;
  tags: string[];
  published_at: string | null;
  view_count: number;
  clone_count: number;
  is_template: boolean;

  // Joined data
  creator?: UserProfile | null;
  stats?: PlanStats;
  user_interaction?: UserInteraction;
}

// Plan statistics
export interface PlanStats {
  likes_count: number;
  rating_avg: number | null;
  rating_count: number;
  comments_count: number;
}

// User's interaction with a plan
export interface UserInteraction {
  has_liked: boolean;
  user_rating: number | null;
}

// Plan like
export interface PlanLike {
  id: string;
  plan_id: string;
  user_id: string;
  created_at: string;
}

// Plan rating
export interface PlanRating {
  id: string;
  plan_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

// Plan comment
export interface PlanComment {
  id: string;
  plan_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;

  // Joined data
  user?: UserProfile;
}

// Marketplace filters
export interface MarketplaceFilters {
  search?: string;
  tags?: string[];
  distance?: number[];
  duration_weeks?: [number, number];
  sort_by?: 'recent' | 'popular' | 'rating' | 'clones';
  from_following?: boolean; // Filter to show only plans from followed users
  creator_id?: string; // Filter by specific creator
  page?: number;
  page_size?: number;
}

// Publish plan request
export interface PublishPlanRequest {
  visibility: PlanVisibility;
  description: string;
  manual_tags: string[];
}

// Predefined tags for selection
export const PREDEFINED_TAGS = [
  // Difficulty levels
  'Anfänger',
  'Fortgeschritten',
  'Experte',

  // Training focus
  'Geschwindigkeit',
  'Ausdauer',
  'Intervalltraining',
  'Tempodauerläufe',

  // Special features
  'Mit Regenerationswochen',
  'Hohe Kilometerzahl',
  'Niedrige Kilometerzahl',
  'Progressiv',

  // Target audience
  'Für Berufstätige',
  'Für Wiedereinsteiger',
  'Erste Marathon',
];

// Auto-generated tags (from database function)
export const AUTO_TAG_DISTANCES = ['5K', '10K', 'Halbmarathon', 'Marathon', 'Ultramarathon', 'Custom'];
export const AUTO_TAG_DURATIONS = ['Kurz (< 6 Wochen)', 'Mittel (6-12 Wochen)', 'Lang (> 12 Wochen)'];
export const AUTO_TAG_TERRAINS = ['Straße', 'Trail', 'Bahn', 'Mixed'];
