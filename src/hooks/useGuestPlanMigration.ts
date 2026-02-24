/**
 * useGuestPlanMigration
 *
 * Wenn ein Gast-Benutzer einen Plan im /editor erstellt und sich danach anmeldet,
 * wird dieser Plan automatisch in den Account gespeichert — kein Datenverlust.
 *
 * Ablauf:
 *  1. Gast erstellt Plan → localStorage['tp_guest_plan']
 *  2. Gast klickt "Anmelden" → LoginPage
 *  3. Anmeldung erfolgreich → user wird non-null
 *  4. Dieser Hook erkennt den Übergang null→user
 *  5. Plan wird in Supabase gespeichert, localStorage bereinigt
 *  6. Weiterleitung zum gespeicherten Plan
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { trainingPlanService } from '../services/trainingPlanService';
import type { TrainingPlan } from '../types';

export const GUEST_PLAN_KEY = 'tp_guest_plan';

export function hasGuestPlan(): boolean {
  try {
    return !!localStorage.getItem(GUEST_PLAN_KEY);
  } catch {
    return false;
  }
}

export function getGuestPlanName(): string | null {
  try {
    const raw = localStorage.getItem(GUEST_PLAN_KEY);
    if (!raw) return null;
    const plan = JSON.parse(raw) as TrainingPlan;
    return plan.event?.name ?? null;
  } catch {
    return null;
  }
}

export function useGuestPlanMigration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Prevent running migration more than once per session
  const migrationAttempted = useRef(false);

  useEffect(() => {
    // Only run when user is logged in and we haven't tried migrating yet
    if (!user || migrationAttempted.current) return;

    const guestPlanRaw = localStorage.getItem(GUEST_PLAN_KEY);
    if (!guestPlanRaw) return;

    // Mark as attempted immediately to prevent double-runs from re-renders
    migrationAttempted.current = true;

    const migrate = async () => {
      try {
        const guestPlan = JSON.parse(guestPlanRaw) as TrainingPlan;
        const saved = await trainingPlanService.createPlan(guestPlan);

        // Clean up localStorage only after successful save
        localStorage.removeItem(GUEST_PLAN_KEY);

        toast.success(`Plan "${guestPlan.event?.name ?? 'Trainingsplan'}" wurde in deinem Account gespeichert!`);

        // Redirect to the newly saved plan
        navigate(`/plan/${saved.id}`, { replace: true });
      } catch (err) {
        console.error('[GuestMigration] Failed to migrate guest plan:', err);
        // Don't clear localStorage on failure — user can try again or export manually
        migrationAttempted.current = false; // Allow retry on next render
        toast.error('Fehler beim Speichern deines Gast-Plans. Bitte exportiere ihn als JSON.');
      }
    };

    migrate();
  }, [user, navigate, toast]);
}
