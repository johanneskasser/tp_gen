export type PlanVisibility = 'private' | 'public' | 'public_anonymous';

export interface Database {
  public: {
    Tables: {
      training_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          plan_data: any; // TrainingPlan JSON
          created_at: string;
          updated_at: string;
          visibility: PlanVisibility;
          description: string | null;
          tags: string[];
          published_at: string | null;
          view_count: number;
          clone_count: number;
          is_template: boolean;
          coach_id?: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          plan_data: any;
          created_at?: string;
          updated_at?: string;
          visibility?: PlanVisibility;
          description?: string | null;
          tags?: string[];
          published_at?: string | null;
          view_count?: number;
          clone_count?: number;
          is_template?: boolean;
          coach_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          plan_data?: any;
          created_at?: string;
          updated_at?: string;
          visibility?: PlanVisibility;
          description?: string | null;
          tags?: string[];
          published_at?: string | null;
          view_count?: number;
          clone_count?: number;
          is_template?: boolean;
          coach_id?: string | null;
        };
      };
      coaching_requests: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          coach_id: string;
          athlete_id: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          coach_id?: string;
          athlete_id?: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          responded_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'coaching_request' | 'coaching_plan_received';
          payload: Record<string, unknown>;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'coaching_request' | 'coaching_plan_received';
          payload: Record<string, unknown>;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'coaching_request' | 'coaching_plan_received';
          payload?: Record<string, unknown>;
          read?: boolean;
          created_at?: string;
        };
      };
      plan_likes: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      plan_ratings: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      plan_comments: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          comment: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
