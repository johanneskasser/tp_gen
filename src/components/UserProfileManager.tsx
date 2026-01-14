import { useState } from 'react';
import { UserProfile, PersonalBest } from '../types/userProfile';
import { getBestVDOT, calculateTrainingZones, getFitnessCategory, formatPace, projectRaceTime } from '../utils/vdotCalculator';
import { User, Plus, TrendingUp, Award, Target } from 'lucide-react';
import { PersonalBestInput } from './PersonalBestInput';
import { PersonalBestCard } from './PersonalBestCard';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
}

/**
 * User Profile Manager
 * Allows users to input personal bests and fitness data
 * for personalized intensity calculations
 */
export function UserProfileManager({ profile, onUpdateProfile }: Props) {
  const [showPBForm, setShowPBForm] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const handleAddPB = async (pb: PersonalBest) => {
    try {
      const updatedProfile = {
        ...profile,
        personalBests: [...profile.personalBests, pb],
      };

      // Calculate VDOT from best PB
      updatedProfile.vdot = getBestVDOT(updatedProfile.personalBests);

      await onUpdateProfile(updatedProfile);
      setShowPBForm(false);
    } catch (error) {
      console.error('Error adding PB:', error);
      alert('Fehler beim Speichern der Bestzeit. Bitte versuche es erneut.');
    }
  };

  const handleEditPB = async (index: number, pb: PersonalBest) => {
    try {
      const updatedProfile = {
        ...profile,
        personalBests: profile.personalBests.map((existingPb, i) =>
          i === index ? pb : existingPb
        ),
      };

      // Recalculate VDOT
      updatedProfile.vdot = getBestVDOT(updatedProfile.personalBests);

      await onUpdateProfile(updatedProfile);
    } catch (error) {
      console.error('Error editing PB:', error);
      alert('Fehler beim Aktualisieren der Bestzeit. Bitte versuche es erneut.');
    }
  };

  const handleDeletePB = async (index: number) => {
    setDeletingIndex(index);
    try {
      const updatedProfile = {
        ...profile,
        personalBests: profile.personalBests.filter((_, i) => i !== index),
      };

      // Recalculate VDOT
      if (updatedProfile.personalBests.length > 0) {
        updatedProfile.vdot = getBestVDOT(updatedProfile.personalBests);
      } else {
        updatedProfile.vdot = undefined;
      }

      await onUpdateProfile(updatedProfile);
    } catch (error) {
      console.error('Error deleting PB:', error);
      alert('Fehler beim Löschen der Bestzeit. Bitte versuche es erneut.');
    } finally {
      setDeletingIndex(null);
    }
  };

  const handleUpdateWeeklyKm = async (km: number) => {
    try {
      await onUpdateProfile({
        ...profile,
        weeklyKmBase: km,
      });
    } catch (error) {
      console.error('Error updating weekly km:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  };

  // Get training zones if VDOT available
  const vdot = profile.vdot || (profile.personalBests.length > 0 ? getBestVDOT(profile.personalBests) : undefined);
  const zones = vdot ? calculateTrainingZones(vdot) : undefined;
  const fitnessCategory = vdot ? getFitnessCategory(vdot) : undefined;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <User className="text-blue-600" size={24} />
          <div>
            <h3 className="text-xl font-bold text-slate-800">Läuferprofil</h3>
            <p className="text-sm text-slate-600">Für personalisierte Trainingsintensität</p>
          </div>
        </div>
      </div>

      {/* Weekly Base Volume */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Aktuelle wöchentliche Kilometer
        </label>
        <input
          type="number"
          value={profile.weeklyKmBase || ''}
          onChange={(e) => handleUpdateWeeklyKm(Number(e.target.value))}
          placeholder="z.B. 40"
          className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500 mt-1">
          Dein durchschnittliches wöchentliches Laufvolumen
        </p>
      </div>

      {/* Personal Bests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Award className="text-yellow-600" size={20} />
            Persönliche Bestzeiten (PBs)
          </label>
          {!showPBForm && (
            <button
              onClick={() => setShowPBForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={16} />
              PB hinzufügen
            </button>
          )}
        </div>

        {/* Add PB Form */}
        {showPBForm && (
          <div className="mb-4 p-5 bg-gradient-to-br from-blue-50 to-primary-50 border-2 border-primary-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-base font-semibold text-slate-800 mb-4">Neue Bestzeit hinzufügen</h4>
            <PersonalBestInput
              onSave={handleAddPB}
              onCancel={() => setShowPBForm(false)}
              mode="add"
            />
          </div>
        )}

        {/* PB List */}
        {profile.personalBests.length > 0 ? (
          <div className="space-y-3">
            {profile.personalBests.map((pb, index) => (
              <PersonalBestCard
                key={index}
                personalBest={pb}
                onEdit={(updatedPb) => handleEditPB(index, updatedPb)}
                onDelete={() => handleDeletePB(index)}
                isDeleting={deletingIndex === index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-dashed border-slate-300">
            <Award className="mx-auto mb-3 text-slate-400" size={40} />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Noch keine Bestzeiten hinzugefügt
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Füge deine Bestzeiten hinzu für personalisierte Trainingsempfehlungen!
            </p>
            {!showPBForm && (
              <button
                onClick={() => setShowPBForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all"
              >
                <Plus size={16} />
                Erste Bestzeit hinzufügen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fitness Summary */}
      {vdot && zones && fitnessCategory && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-purple-600" size={20} />
            <h4 className="font-semibold text-slate-800">Deine Fitness</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-xs text-slate-600">VDOT</div>
              <div className="text-2xl font-bold text-purple-600">{vdot.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-600">Kategorie</div>
              <div className="text-lg font-semibold text-slate-800">{fitnessCategory.category}</div>
              <div className="text-xs text-slate-500">{fitnessCategory.description}</div>
            </div>
          </div>

          {/* Training Zones */}
          <div className="bg-white rounded p-3 space-y-2">
            <div className="font-medium text-sm text-slate-700 mb-2">📊 Deine Trainingszonen</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Easy:</span>
                <span className="font-medium">{formatPace(zones.easy.min)} - {formatPace(zones.easy.max)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Marathon:</span>
                <span className="font-medium">{formatPace(zones.marathon)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Threshold:</span>
                <span className="font-medium">{formatPace(zones.threshold)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Interval:</span>
                <span className="font-medium">{formatPace(zones.interval)}</span>
              </div>
            </div>
          </div>

          {/* Race Projections */}
          <div className="mt-3 bg-white rounded p-3">
            <div className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-1">
              <Target size={14} />
              Wettkampf-Prognosen
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <div className="text-slate-600">5K</div>
                <div className="font-medium">{projectRaceTime(vdot, 5)}</div>
              </div>
              <div>
                <div className="text-slate-600">10K</div>
                <div className="font-medium">{projectRaceTime(vdot, 10)}</div>
              </div>
              <div>
                <div className="text-slate-600">HM</div>
                <div className="font-medium">{projectRaceTime(vdot, 21.0975)}</div>
              </div>
              <div>
                <div className="text-slate-600">Marathon</div>
                <div className="font-medium">{projectRaceTime(vdot, 42.195)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
