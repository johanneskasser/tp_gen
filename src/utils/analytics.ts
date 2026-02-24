import type { SessionType } from '../types';

/**
 * Central analytics utility.
 * Wraps Plausible custom events and Meta Pixel standard events.
 * Both are called from this file — all event names live here.
 */

const plausible = (eventName: string, props?: Record<string, string>) => {
  window.plausible?.(eventName, { props });
};

const metaPixel = (event: string, data?: Record<string, unknown>) => {
  window.fbq?.('track', event, data);
};

export const analytics = {
  /**
   * User successfully signed up (first account creation).
   * Fires both Plausible and Meta Pixel CompleteRegistration.
   */
  trackSignup: (method: 'email' | 'google' | 'github' | 'magic_link') => {
    plausible('Signup', { method });
    metaPixel('CompleteRegistration', { method });
  },

  /**
   * User completed the onboarding flow (4-step wizard).
   */
  trackOnboardingCompleted: (runnerLevel: 'beginner' | 'intermediate' | 'advanced') => {
    plausible('Onboarding Completed', { runner_level: runnerLevel });
  },

  /**
   * Day Zero Activation: user created a plan from scratch in PlanEditor.
   * distance: the event distance string from RaceEvent (e.g. '5K', 'MARATHON', 'CUSTOM')
   */
  trackPlanCreated: (distance: string) => {
    plausible('Plan Created', { method: 'scratch', distance });
  },

  /**
   * Day Zero Activation: user cloned a plan from the marketplace.
   */
  trackPlanCloned: (distance: string) => {
    plausible('Plan Cloned', { distance });
  },

  /**
   * User exported a plan in any format.
   */
  trackPlanExported: (format: 'pdf' | 'json' | 'ical' | 'fit') => {
    plausible('Plan Exported', { format });
  },

  /**
   * User published a plan to the marketplace.
   */
  trackPlanPublished: () => {
    plausible('Plan Published');
  },

  /**
   * User activated an iCal subscription for a plan.
   */
  trackICalSubscription: () => {
    plausible('iCal Subscription Started');
  },

  /**
   * User opened the AI coaching panel.
   */
  trackCoachingPanelViewed: () => {
    plausible('Coaching Panel Viewed');
  },

  /**
   * Retention: existing user logged in again.
   * daysSinceSignup: number of full days since their account was created.
   * Only meaningful when > 0 (returning user, not same-day signup).
   */
  trackReturnLogin: (daysSinceSignup: number) => {
    if (daysSinceSignup > 0) {
      plausible('Return Login', { days: String(daysSinceSignup) });
    }
  },

  /**
   * User triggered the suggestion panel (clicked "Vorschläge erhalten").
   */
  trackSuggestionPanelOpened: () => {
    plausible('Suggestion Panel Opened');
  },

  /**
   * User expanded the week analysis inside the suggestion panel.
   */
  trackSuggestionAnalysisViewed: () => {
    plausible('Suggestion Analysis Viewed');
  },

  /**
   * Suggestions were generated and shown to the user.
   * count: how many suggestions appeared in the list.
   */
  trackSuggestionsShown: (count: number) => {
    plausible('Suggestions Shown', { count: String(count) });
  },

  /**
   * User accepted a suggestion.
   * type: the SessionType of the accepted suggestion (e.g. 'easy', 'intervals').
   */
  trackSuggestionAccepted: (type: SessionType) => {
    plausible('Suggestion Accepted', { type });
  },

  /**
   * User rejected a suggestion.
   * type: the SessionType of the rejected suggestion.
   */
  trackSuggestionRejected: (type: SessionType) => {
    plausible('Suggestion Rejected', { type });
  },

  // ─── Guest / Public Editor ────────────────────────────────────────────────

  /**
   * Unauthenticated user opened the public /editor route.
   * Key top-of-funnel goal: measures how many visitors actually start editing.
   */
  trackGuestEditorOpened: () => {
    plausible('Guest Editor Opened');
  },

  /**
   * Guest user completed event configuration and has a live plan.
   * Signals intent — they got past the blank-slate setup.
   */
  trackGuestPlanCreated: (distance: string) => {
    plausible('Guest Plan Created', { distance });
  },

  /**
   * Guest user exported their plan (PDF or JSON).
   * Strong activation signal — they got value without signing up.
   */
  trackGuestPlanExported: (format: 'pdf' | 'json') => {
    plausible('Guest Plan Exported', { format });
  },

  /**
   * Guest user clicked any "Anmelden" / "Registrieren" CTA inside the editor.
   * source: which CTA was clicked (e.g. 'banner', 'header', 'bottom_cta').
   */
  trackGuestSignupCTAClicked: (source: 'banner' | 'header' | 'bottom_cta') => {
    plausible('Guest Signup CTA Clicked', { source });
  },

  // ─── Landing Page ─────────────────────────────────────────────────────────

  /**
   * User clicked the primary hero CTA ("Editor öffnen").
   */
  trackHeroCTAClicked: (cta: 'editor' | 'marketplace') => {
    plausible('Hero CTA Clicked', { cta });
  },

  /**
   * User clicked the CTA inside the EditorManifestoSection.
   */
  trackManifestoCTAClicked: () => {
    plausible('Manifesto CTA Clicked');
  },

  /**
   * User clicked the CTA inside the final CTASection.
   * cta: which button was clicked ('editor' or 'marketplace').
   */
  trackFinalCTAClicked: (cta: 'editor' | 'marketplace') => {
    plausible('Final CTA Clicked', { cta });
  },
};
