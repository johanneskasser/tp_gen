import { useState } from 'react';
import { UserProfile, PersonalBest } from '../types/userProfile';
import { calculateVDOT, getBestVDOT, calculateTrainingZones, getFitnessCategory, formatPace, projectRaceTime } from '../utils/vdotCalculator';
import { User, Plus, Trash2, TrendingUp, Award, Target } from 'lucide-react';

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
  const [newPB, setNewPB] = useState<Partial<PersonalBest>>({
    distance: '10K',
    time: '',
  });

  const handleAddPB = async (keepFormOpen: boolean = false) => {
    if (!newPB.time) {
      alert('Bitte Zeit eingeben');
      return;
    }

    try {
      const pb: PersonalBest = {
        distance: newPB.distance as PersonalBest['distance'],
        time: newPB.time,
        customDistanceKm: newPB.customDistanceKm,
        date: new Date().toISOString().split('T')[0],
      };

      const updatedProfile = {
        ...profile,
        personalBests: [...profile.personalBests, pb],
      };

      // Calculate VDOT from best PB
      updatedProfile.vdot = getBestVDOT(updatedProfile.personalBests);

      await onUpdateProfile(updatedProfile);

      // Reset form
      setNewPB({ distance: '10K', time: '' });

      // Only close form if keepFormOpen is false
      if (!keepFormOpen) {
        setShowPBForm(false);
      }
    } catch (error) {
      console.error('Error adding PB:', error);
      alert('Fehler beim Speichern der Bestzeit. Bitte versuche es erneut.');
    }
  };

  const handleDeletePB = async (index: number) => {
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
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Award className="text-yellow-600" size={18} />
            Persönliche Bestzeiten (PBs)
          </label>
          <button
            onClick={() => setShowPBForm(!showPBForm)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            PB hinzufügen
          </button>
        </div>

        {/* PB List */}
        {profile.personalBests.length > 0 ? (
          <div className="space-y-2 mb-3">
            {profile.personalBests.map((pb, index) => {
              const vdot = calculateVDOT(pb);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50 rounded p-3 border border-slate-200"
                >
                  <div>
                    <div className="font-medium text-slate-800">
                      {pb.distance === 'CUSTOM' ? `${pb.customDistanceKm}km` : pb.distance}
                    </div>
                    <div className="text-sm text-slate-600">
                      Zeit: {pb.time} • VDOT: {vdot.toFixed(1)}
                    </div>
                    {pb.date && (
                      <div className="text-xs text-slate-500">
                        {new Date(pb.date).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeletePB(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-slate-500 bg-slate-50 rounded p-3 mb-3">
            Noch keine PBs hinzugefügt. Füge deine Bestzeiten hinzu für personalisierte Empfehlungen!
          </div>
        )}

        {/* Add PB Form */}
        {showPBForm && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Distanz
                </label>
                <select
                  value={newPB.distance}
                  onChange={(e) => setNewPB({ ...newPB, distance: e.target.value as PersonalBest['distance'] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5K">5K</option>
                  <option value="10K">10K</option>
                  <option value="HALF_MARATHON">Halbmarathon</option>
                  <option value="MARATHON">Marathon</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              {newPB.distance === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Distanz (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPB.customDistanceKm || ''}
                    onChange={(e) => setNewPB({ ...newPB, customDistanceKm: Number(e.target.value) })}
                    placeholder="z.B. 15"
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Zeit (HH:MM:SS oder MM:SS)
                </label>
                <input
                  type="text"
                  value={newPB.time}
                  onChange={(e) => setNewPB({ ...newPB, time: e.target.value })}
                  placeholder="z.B. 45:30 oder 1:32:15"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAddPB(true)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Speichern & Weiteren hinzufügen
              </button>
              <button
                onClick={() => handleAddPB(false)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Speichern
              </button>
              <button
                onClick={() => setShowPBForm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-sm rounded hover:bg-slate-300 transition-colors"
              >
                Abbrechen
              </button>
            </div>
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
