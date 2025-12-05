export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      personal_bests: {
        Row: {
          created_at: string | null
          custom_distance_km: number | null
          date: string | null
          distance: string
          id: string
          time: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_distance_km?: number | null
          date?: string | null
          distance: string
          id?: string
          time: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_distance_km?: number | null
          date?: string | null
          distance?: string
          id?: string
          time?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          plan_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          plan_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          plan_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_comments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_likes: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_likes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_ratings: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_ratings_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      target_races: {
        Row: {
          created_at: string | null
          date: string
          distance: string
          id: string
          target_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          distance: string
          id?: string
          target_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          distance?: string
          id?: string
          target_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      training_plans: {
        Row: {
          clone_count: number
          created_at: string
          description: string | null
          id: string
          is_template: boolean
          name: string
          plan_data: Json
          published_at: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          view_count: number
          visibility: Database["public"]["Enums"]["plan_visibility"]
        }
        Insert: {
          clone_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name: string
          plan_data: Json
          published_at?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["plan_visibility"]
        }
        Update: {
          clone_count?: number
          created_at?: string
          description?: string | null
          id?: string
          is_template?: boolean
          name?: string
          plan_data?: Json
          published_at?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["plan_visibility"]
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age: number | null
          available_time_per_week: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          estimated_vo2_max: number | null
          follower_count: number
          following_count: number
          full_name: string | null
          gender: string | null
          id: string
          preferred_training_days: number[] | null
          updated_at: string
          vdot: number | null
          weekly_km_base: number | null
          years_running: number | null
        }
        Insert: {
          age?: number | null
          available_time_per_week?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          estimated_vo2_max?: number | null
          follower_count?: number
          following_count?: number
          full_name?: string | null
          gender?: string | null
          id: string
          preferred_training_days?: number[] | null
          updated_at?: string
          vdot?: number | null
          weekly_km_base?: number | null
          years_running?: number | null
        }
        Update: {
          age?: number | null
          available_time_per_week?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          estimated_vo2_max?: number | null
          follower_count?: number
          following_count?: number
          full_name?: string | null
          gender?: string | null
          id?: string
          preferred_training_days?: number[] | null
          updated_at?: string
          vdot?: number | null
          weekly_km_base?: number | null
          years_running?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_automatic_tags: { Args: { plan_data: Json }; Returns: string[] }
      get_follower_count: { Args: { user_uuid: string }; Returns: number }
      get_following_count: { Args: { user_uuid: string }; Returns: number }
      get_plan_stats: {
        Args: { plan_uuid: string }
        Returns: {
          comments_count: number
          likes_count: number
          rating_avg: number
          rating_count: number
        }[]
      }
      get_plans_from_following: {
        Args: { user_uuid: string }
        Returns: {
          clone_count: number
          plan_id: string
          plan_name: string
          published_at: string
          user_id: string
          view_count: number
          visibility: Database["public"]["Enums"]["plan_visibility"]
        }[]
      }
      increment_clone_count: { Args: { plan_uuid: string }; Returns: undefined }
      increment_view_count: { Args: { plan_uuid: string }; Returns: undefined }
      is_following: {
        Args: { follower_uuid: string; following_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      plan_visibility: "private" | "public" | "public_anonymous"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plan_visibility: ["private", "public", "public_anonymous"],
    },
  },
} as const
