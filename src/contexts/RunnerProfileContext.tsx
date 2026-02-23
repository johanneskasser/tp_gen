import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserProfile } from '../types/userProfile';
import { useAuth } from './AuthContext';
import { getBestVDOT } from '../utils/vdotCalculator';
import {
  fetchRunnerProfile,
  saveRunnerProfile,
  initializeRunnerProfile,
} from '../services/runnerProfileService';

interface RunnerProfileContextType {
  runnerProfile: UserProfile | null;
  updateRunnerProfile: (profile: UserProfile) => Promise<void>;
  refreshProfile: () => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const RunnerProfileContext = createContext<RunnerProfileContextType | undefined>(undefined);

export function RunnerProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [runnerProfile, setRunnerProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load runner profile from database or migrate from localStorage
  const loadProfile = useCallback(async (userId: string, userEmail: string) => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from database
      let profile = await fetchRunnerProfile(userId);

      if (!profile) {
        // Check if there's a localStorage profile to migrate
        const storageKey = `runner_profile_${userId}`;
        const saved = localStorage.getItem(storageKey);

        if (saved) {
          try {
            const localProfile = JSON.parse(saved);
            // Calculate VDOT if we have PBs but no VDOT
            if (localProfile.personalBests?.length > 0 && !localProfile.vdot) {
              localProfile.vdot = getBestVDOT(localProfile.personalBests);
            }

            // Save to database
            await saveRunnerProfile(localProfile);

            // Remove from localStorage after successful migration
            localStorage.removeItem(storageKey);

            profile = localProfile;
            console.log('Successfully migrated profile from localStorage to Supabase');
          } catch (error) {
            console.error('Error migrating profile from localStorage:', error);
          }
        }

        // If still no profile, initialize a new one
        if (!profile) {
          profile = await initializeRunnerProfile(userId, userEmail);
        }
      }

      setRunnerProfile(profile);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load profile');
      setError(error);
      console.error('Error loading runner profile:', error);

      // Fallback to a basic profile
      setRunnerProfile({
        id: userId,
        name: userEmail || 'Läufer',
        personalBests: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile when user changes
  useEffect(() => {
    if (user) {
      loadProfile(user.id, user.email || 'Läufer');
    } else {
      setRunnerProfile(null);
      setLoading(false);
    }
  }, [user, loadProfile]);

  // Update profile in database
  const updateRunnerProfile = async (profile: UserProfile) => {
    try {
      setError(null);
      await saveRunnerProfile(profile);
      setRunnerProfile(profile);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      console.error('Error updating runner profile:', error);
      throw error;
    }
  };

  // Refresh profile from database
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id, user.email || 'Läufer');
    }
  };

  return (
    <RunnerProfileContext.Provider
      value={{
        runnerProfile,
        updateRunnerProfile,
        refreshProfile,
        loading,
        error
      }}
    >
      {children}
    </RunnerProfileContext.Provider>
  );
}

export function useRunnerProfile() {
  const context = useContext(RunnerProfileContext);
  if (context === undefined) {
    throw new Error('useRunnerProfile must be used within a RunnerProfileProvider');
  }
  return context;
}
