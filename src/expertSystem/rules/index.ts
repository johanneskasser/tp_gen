/**
 * Training Rules Index
 *
 * Exports all rule categories for the expert system
 */

export * from './recoveryRules';
export * from './volumeRules';
export * from './intensityRules';
export * from './sessionPlacementRules';
export * from './periodizationRules';

import { TrainingRule } from '../types';
import { RECOVERY_RULES } from './recoveryRules';
import { VOLUME_RULES } from './volumeRules';
import { INTENSITY_RULES } from './intensityRules';
import { SESSION_PLACEMENT_RULES } from './sessionPlacementRules';
import { PERIODIZATION_RULES } from './periodizationRules';

/**
 * All training rules combined
 */
export const ALL_RULES: TrainingRule[] = [
  ...RECOVERY_RULES,
  ...VOLUME_RULES,
  ...INTENSITY_RULES,
  ...SESSION_PLACEMENT_RULES,
  ...PERIODIZATION_RULES,
];

/**
 * Get rules by category
 */
export function getRulesByCategory(category: string): TrainingRule[] {
  return ALL_RULES.filter((rule) => rule.category === category);
}

/**
 * Get rules by priority
 */
export function getRulesByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): TrainingRule[] {
  return ALL_RULES.filter((rule) => rule.priority === priority);
}

/**
 * Get rule by ID
 */
export function getRuleById(id: string): TrainingRule | undefined {
  return ALL_RULES.find((rule) => rule.id === id);
}
