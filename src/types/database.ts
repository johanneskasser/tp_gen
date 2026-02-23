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
