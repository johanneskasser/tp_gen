import { supabase } from '../lib/supabase';
import { TrainingPlan } from '../types';
import { PlanVisibility } from '../types/database';

export interface SavedTrainingPlan {
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
  is_active: boolean;
  coach_id: string | null;
}

export const trainingPlanService = {
  // Get all plans for current user
  async getAllPlans(): Promise<SavedTrainingPlan[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as SavedTrainingPlan[];
  },

  // Get single plan by ID
  async getPlanById(id: string): Promise<SavedTrainingPlan | null> {
    const { data, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as unknown as SavedTrainingPlan;
  },

  // Create new plan
  async createPlan(plan: TrainingPlan, coachId?: string, athleteId?: string): Promise<SavedTrainingPlan> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    let planId: string;

    if (coachId && athleteId) {
      // Coaching plan: use RPC (SECURITY DEFINER bypasses RLS)
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_coaching_plan', {
        p_athlete_id: athleteId,
        p_name: plan.event.name,
        p_plan_data: plan as any,
      });
      if (rpcError) throw rpcError;

      // RPC may return UUID string (old) or array of rows (new SETOF) — handle both
      const planId: string = typeof rpcData === 'string'
        ? rpcData
        : Array.isArray(rpcData) ? rpcData[0]?.id : (rpcData as any)?.id;

      if (!planId) throw new Error('create_coaching_plan returned no plan id');

      supabase.functions
        .invoke('send-coaching-plan-email', { body: { planId } })
        .catch((err) => console.error('Plan email failed (non-fatal):', err));

      // Fetch full row — allowed by coach_select_coaching_plans policy
      const { data: saved, error: fetchError } = await supabase
        .from('training_plans').select('*').eq('id', planId).single();
      if (fetchError) throw fetchError;
      return saved as unknown as SavedTrainingPlan;
    }

    // Own plan: direct insert
    const { data, error } = await supabase
      .from('training_plans')
      .insert({
        user_id: user.id,
        name: plan.event.name,
        plan_data: plan as any,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as SavedTrainingPlan;
  },

  // Update existing plan
  async updatePlan(id: string, plan: TrainingPlan): Promise<SavedTrainingPlan> {
    const { data, error } = await supabase
      .from('training_plans')
      .update({
        name: plan.event.name,
        plan_data: plan as any,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as SavedTrainingPlan;
  },

  // Get all coaching plans the current user (coach) created for a specific athlete
  async getCoachPlansForAthlete(athleteId: string): Promise<SavedTrainingPlan[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('coach_id', user.id)
      .eq('user_id', athleteId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as SavedTrainingPlan[];
  },

  // Delete plan
  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('training_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Set a plan as active (deactivates all other plans for the user)
  async setActivePlan(id: string): Promise<void> {
    const { error } = await supabase.rpc('set_active_plan', {
      plan_uuid: id,
    });

    if (error) throw error;
  },

  // Toggle active status of a plan
  async toggleActivePlan(id: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('toggle_active_plan', {
      plan_uuid: id,
    });

    if (error) throw error;
    return data as boolean;
  },
};
