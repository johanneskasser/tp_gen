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
};
