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
  async createPlan(plan: TrainingPlan): Promise<SavedTrainingPlan> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

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

  // Delete plan
  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('training_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
