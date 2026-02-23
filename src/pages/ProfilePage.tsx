import { useState, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { useToast } from '../contexts/ToastContext';
import { profileService } from '../services/profileService';
import { Camera, Save, Loader2, Zap, Pencil, User, Heart, Activity, Trophy, Plus, Trash2, Info } from 'lucide-react';
import { Button, Input, Card, Modal } from '../components/ui';
import { typography, cn } from '../lib/designSystem';
import { UserProfileManager } from '../components/UserProfileManager';
import { PersonalBestInput } from '../components/PersonalBestInput';
import { PersonalBest } from '../types/userProfile';
import { getBestVDOT } from '../utils/vdotCalculator';
import {
  calculateBMI,
  calculateHeartRateZones,
  estimateMaxHeartRate,
  estimateBodyFatPercentage,
} from '../utils/biomarkerUtils';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { runnerProfile, updateRunnerProfile } = useRunnerProfile();
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Dialog state
  const [openDialog, setOpenDialog] = useState<
    'personal' | 'avatar' | 'health' | 'runner' | 'pbs' | 'vdot-info' | null
  >(null);

  // Personal Info state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [personalLoading, setPersonalLoading] = useState(false);

  // Health state
  const [age, setAge] = useState<number | ''>(profile?.age || '');
  const [gender, setGender] = useState<string>(profile?.gender || '');
  const [heightCm, setHeightCm] = useState<number | ''>(profile?.height_cm || '');
  const [weightKg, setWeightKg] = useState<number | ''>(profile?.weight_kg || '');
  const [restingHR, setRestingHR] = useState<number | ''>(profile?.resting_heart_rate_bpm || '');
  const [maxHR, setMaxHR] = useState<number | ''>(profile?.max_heart_rate_bpm || '');
  const [healthLoading, setHealthLoading] = useState(false);

  // Runner profile state
  const [motivationText, setMotivationText] = useState(profile?.motivation_text || '');
  const [longestRunKm, setLongestRunKm] = useState<number | ''>(runnerProfile?.longestRunKm || '');
  const [runnerLoading, setRunnerLoading] = useState(false);

  // PBs state
  const [showPBForm, setShowPBForm] = useState(false);
  const [editingPBIndex, setEditingPBIndex] = useState<number | null>(null);
  const [deletingPBIndex, setDeletingPBIndex] = useState<number | null>(null);

  // Calculate metrics
  const metrics = useMemo(() => {
    const bmi = heightCm && weightKg ? calculateBMI(Number(heightCm), Number(weightKg)) : null;
    const bodyFat =
      bmi && age && gender
        ? estimateBodyFatPercentage(gender as 'male' | 'female' | 'other', Number(age), bmi.value)
        : null;
    const hrZones =
      restingHR && maxHR ? calculateHeartRateZones(Number(restingHR), Number(maxHR)) : null;

    return { bmi, bodyFat, hrZones };
  }, [heightCm, weightKg, age, gender, restingHR, maxHR]);

  const handleSavePersonal = async () => {
    if (!user) return;
    setPersonalLoading(true);

    try {
      await profileService.updateProfile(user.id, {
        full_name: fullName,
        bio: bio,
      });
      await refreshProfile();
      toast.success('Persönliche Informationen aktualisiert');
      setOpenDialog(null);
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
      console.error(err);
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleSaveHealth = async () => {
    if (!user) return;
    setHealthLoading(true);

    try {
      await profileService.updateProfile(user.id, {
        age: age || null,
        gender: gender || null,
        height_cm: heightCm || null,
        weight_kg: weightKg || null,
        resting_heart_rate_bpm: restingHR || null,
        max_heart_rate_bpm: maxHR || null,
      });

      if (runnerProfile) {
        await updateRunnerProfile({
          ...runnerProfile,
          age: age || undefined,
          gender: gender as any,
          heightCm: heightCm || undefined,
          weightKg: weightKg || undefined,
          restingHeartRateBpm: restingHR || undefined,
          maxHeartRateBpm: maxHR || undefined,
        });
      }

      await refreshProfile();
      toast.success('Gesundheitsdaten aktualisiert');
      setOpenDialog(null);
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  const handleSaveRunner = async () => {
    if (!user) return;
    setRunnerLoading(true);

    try {
      await profileService.updateProfile(user.id, {
        motivation_text: motivationText || null,
      });

      if (runnerProfile) {
        await updateRunnerProfile({
          ...runnerProfile,
          motivationText: motivationText || undefined,
          longestRunKm: longestRunKm || undefined,
        });
      }

      await refreshProfile();
      toast.success('Läuferprofil aktualisiert');
      setOpenDialog(null);
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
      console.error(err);
    } finally {
      setRunnerLoading(false);
    }
  };

  const handleAddPB = async (pb: PersonalBest) => {
    if (!runnerProfile) return;

    try {
      const updatedPBs = [...runnerProfile.personalBests, pb];
      const updatedProfile = {
        ...runnerProfile,
        personalBests: updatedPBs,
        vdot: getBestVDOT(updatedPBs),
      };

      await updateRunnerProfile(updatedProfile);
      toast.success('Bestzeit hinzugefügt');
      setShowPBForm(false);
    } catch (err) {
      toast.error('Fehler beim Hinzufügen der Bestzeit');
      console.error(err);
    }
  };

  const handleEditPB = async (index: number, pb: PersonalBest) => {
    if (!runnerProfile) return;

    try {
      const updatedPBs = runnerProfile.personalBests.map((existingPb, i) =>
        i === index ? pb : existingPb
      );
      const updatedProfile = {
        ...runnerProfile,
        personalBests: updatedPBs,
        vdot: getBestVDOT(updatedPBs),
      };

      await updateRunnerProfile(updatedProfile);
      toast.success('Bestzeit aktualisiert');
      setEditingPBIndex(null);
    } catch (err) {
      toast.error('Fehler beim Aktualisieren der Bestzeit');
      console.error(err);
    }
  };

  const handleDeletePB = async (index: number) => {
    if (!runnerProfile) return;

    setDeletingPBIndex(index);
    try {
      const updatedPBs = runnerProfile.personalBests.filter((_, i) => i !== index);
      const updatedProfile = {
        ...runnerProfile,
        personalBests: updatedPBs,
        vdot: updatedPBs.length > 0 ? getBestVDOT(updatedPBs) : undefined,
      };

      await updateRunnerProfile(updatedProfile);
      toast.success('Bestzeit gelöscht');
    } catch (err) {
      toast.error('Fehler beim Löschen der Bestzeit');
      console.error(err);
    } finally {
      setDeletingPBIndex(null);
    }
  };

  const handleEstimateMaxHR = () => {
    if (age) {
      const estimated = estimateMaxHeartRate(Number(age));
      setMaxHR(estimated);
      toast.success(`Maximalpuls auf ${estimated} bpm geschätzt`);
    } else {
      toast.error('Bitte gib zuerst dein Alter ein');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Bild darf maximal 2MB groß sein');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte nur Bilddateien hochladen');
      return;
    }

    setUploading(true);

    try {
      if (profile?.avatar_url) {
        try {
          await profileService.deleteAvatar(profile.avatar_url);
        } catch (err) {
          console.error('Error deleting old avatar:', err);
        }
      }

      const avatarUrl = await profileService.uploadAvatar(user.id, file);
      if (avatarUrl) {
        await profileService.updateProfile(user.id, { avatar_url: avatarUrl });
        await refreshProfile();
        setImageError(false);
        toast.success('Profilbild erfolgreich aktualisiert');
        setOpenDialog(null);
      }
    } catch (err) {
      toast.error('Fehler beim Hochladen des Profilbilds');
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBMIColor = (category: string) => {
    switch (category) {
      case 'Normalgewicht':
        return 'text-green-700 bg-green-50';
      case 'Untergewicht':
      case 'Übergewicht':
        return 'text-amber-700 bg-amber-50';
      case 'Adipositas':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const getGenderLabel = (genderValue: string) => {
    switch (genderValue) {
      case 'male':
        return 'Männlich';
      case 'female':
        return 'Weiblich';
      case 'other':
        return 'Divers';
      default:
        return 'Nicht angegeben';
    }
  };

  const getDistanceLabel = (pb: PersonalBest) => {
    if (pb.distance === 'CUSTOM' && pb.customDistanceKm) {
      return `${pb.customDistanceKm} km`;
    }
    return pb.distance;
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
      {/* Header with Avatar */}
      <div className="flex items-center gap-6 mb-8">
        <div
          className="relative cursor-pointer group"
          onClick={() => setOpenDialog('avatar')}
        >
          {profile?.avatar_url && !imageError ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover transition-all group-hover:brightness-50"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary-200 flex items-center justify-center group-hover:brightness-90 transition-all">
              <span className="text-2xl sm:text-3xl font-bold text-primary-800">
                {getInitials(profile?.full_name || null)}
              </span>
            </div>
          )}

          {/* Hover Pencil Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil size={24} className="text-white drop-shadow-lg" />
          </div>
        </div>

        <div className="flex-1">
          <h1 className={cn(typography.h1, 'mb-1')}>{profile?.full_name || 'Dein Profil'}</h1>
          <p className={cn(typography.body, 'text-text-tertiary')}>{user?.email}</p>
        </div>
      </div>

      {/* Persönliche Informationen */}
      <Card variant="default" className="mb-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User size={20} className="text-text-tertiary" />
            <h2 className={cn(typography.h3)}>Persönliche Informationen</h2>
          </div>
          <button
            onClick={() => {
              setFullName(profile?.full_name || '');
              setBio(profile?.bio || '');
              setOpenDialog('personal');
            }}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
            aria-label="Bearbeiten"
          >
            <Pencil size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-text-tertiary mb-1">Name</div>
            <div className="font-medium">{profile?.full_name || 'Nicht angegeben'}</div>
          </div>
          <div>
            <div className="text-text-tertiary mb-1">E-Mail</div>
            <div className="font-medium">{user?.email}</div>
          </div>
          {profile?.bio && (
            <div className="sm:col-span-2">
              <div className="text-text-tertiary mb-1">Bio</div>
              <div className="font-medium">{profile.bio}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Gesundheitsdaten */}
      <Card variant="default" className="mb-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-text-tertiary" />
            <h2 className={cn(typography.h3)}>Gesundheitsdaten</h2>
          </div>
          <button
            onClick={() => {
              setAge(profile?.age || '');
              setGender(profile?.gender || '');
              setHeightCm(profile?.height_cm || '');
              setWeightKg(profile?.weight_kg || '');
              setRestingHR(profile?.resting_heart_rate_bpm || '');
              setMaxHR(profile?.max_heart_rate_bpm || '');
              setOpenDialog('health');
            }}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
            aria-label="Bearbeiten"
          >
            <Pencil size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-text-tertiary mb-1">Alter</div>
            <div className="font-medium">{age || 'Nicht angegeben'}</div>
          </div>
          <div>
            <div className="text-text-tertiary mb-1">Geschlecht</div>
            <div className="font-medium">{getGenderLabel(gender)}</div>
          </div>
          <div>
            <div className="text-text-tertiary mb-1">Größe</div>
            <div className="font-medium">{heightCm ? `${heightCm} cm` : 'Nicht angegeben'}</div>
          </div>
          <div>
            <div className="text-text-tertiary mb-1">Gewicht</div>
            <div className="font-medium">{weightKg ? `${weightKg} kg` : 'Nicht angegeben'}</div>
          </div>
          <div>
            <div className="text-text-tertiary mb-1">Ruhepuls</div>
            <div className="font-medium">
              {restingHR ? `${restingHR} bpm` : 'Nicht angegeben'}
            </div>
          </div>
          <div>
            <div className="text-text-tertiary mb-1">Maximalpuls</div>
            <div className="font-medium">{maxHR ? `${maxHR} bpm` : 'Nicht angegeben'}</div>
          </div>

          {/* Calculated Metrics */}
          {metrics.bmi && (
            <div>
              <div className="text-text-tertiary mb-1">BMI</div>
              <div className={cn('inline-block px-2 py-1 rounded font-medium', getBMIColor(metrics.bmi.category))}>
                {metrics.bmi.value}
              </div>
            </div>
          )}
          {metrics.bodyFat !== null && (
            <div>
              <div className="text-text-tertiary mb-1">Körperfett (geschätzt)</div>
              <div className="font-medium">{metrics.bodyFat}%</div>
            </div>
          )}
        </div>

        {/* HR Zones */}
        {metrics.hrZones && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <div className="text-sm font-semibold text-text-secondary mb-2">
              HF-Trainingszonen
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-tertiary">Regeneration:</span>
                <span className="font-mono font-medium">
                  {metrics.hrZones.recovery.min}-{metrics.hrZones.recovery.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Locker:</span>
                <span className="font-mono font-medium">
                  {metrics.hrZones.easy.min}-{metrics.hrZones.easy.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Tempo:</span>
                <span className="font-mono font-medium">
                  {metrics.hrZones.tempo.min}-{metrics.hrZones.tempo.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Intervall:</span>
                <span className="font-mono font-medium">
                  {metrics.hrZones.interval.min}-{metrics.hrZones.interval.max}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">Maximum:</span>
                <span className="font-mono font-medium">
                  {metrics.hrZones.max.min}-{metrics.hrZones.max.max}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Läuferprofil */}
      <Card variant="default" className="mb-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-text-tertiary" />
            <h2 className={cn(typography.h3)}>Läuferprofil</h2>
          </div>
          <button
            onClick={() => {
              setMotivationText(profile?.motivation_text || '');
              setLongestRunKm(runnerProfile?.longestRunKm || '');
              setOpenDialog('runner');
            }}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
            aria-label="Bearbeiten"
          >
            <Pencil size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-text-tertiary mb-1">Wöchentliche Kilometer</div>
            <div className="font-medium">
              {runnerProfile?.weeklyKmBase ? `${runnerProfile.weeklyKmBase} km` : 'Nicht angegeben'}
            </div>
          </div>
          <div>
            <div className="text-text-tertiary mb-1">Weiteste Distanz</div>
            <div className="font-medium">
              {longestRunKm ? `${longestRunKm} km` : 'Nicht angegeben'}
            </div>
          </div>
          {motivationText && (
            <div className="sm:col-span-2">
              <div className="text-text-tertiary mb-1">Motivation & Ziele</div>
              <div className="font-medium">{motivationText}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Deine Fitness - Compact PBs */}
      <Card variant="default" className="mb-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-text-tertiary" />
            <h2 className={cn(typography.h3)}>Deine Fitness</h2>
          </div>
          <button
            onClick={() => {
              setShowPBForm(false);
              setEditingPBIndex(null);
              setOpenDialog('pbs');
            }}
            className="p-2 text-text-tertiary hover:text-text-primary hover:bg-slate-50 rounded-lg transition-colors"
            aria-label="Bearbeiten"
          >
            <Pencil size={18} />
          </button>
        </div>

        {runnerProfile && runnerProfile.personalBests.length > 0 ? (
          <div className="space-y-2">
            {/* VDOT Display */}
            {runnerProfile.vdot && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg text-sm">
                <span className="text-text-tertiary">VDOT</span>
                <span className="text-lg font-bold text-blue-700">{runnerProfile.vdot.toFixed(1)}</span>
              </div>
            )}

            {/* Compact PBs List */}
            <div className="space-y-1.5 text-sm">
              {runnerProfile.personalBests.map((pb, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-primary-700 min-w-[60px]">
                      {getDistanceLabel(pb)}
                    </div>
                    <div className="font-mono font-medium">{pb.time}</div>
                    {pb.date && (
                      <div className="text-xs text-text-tertiary">
                        {new Date(pb.date).toLocaleDateString('de-DE')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-text-tertiary">
            <Trophy size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Noch keine Bestzeiten hinterlegt</p>
          </div>
        )}
      </Card>

      {/* Dialogs */}

      {/* Personal Info Dialog */}
      <Modal
        isOpen={openDialog === 'personal'}
        onClose={() => setOpenDialog(null)}
        title="Persönliche Informationen bearbeiten"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenDialog(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSavePersonal} loading={personalLoading}>
              <Save size={18} />
              Speichern
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dein vollständiger Name"
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Bio (optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={cn(
                'block w-full rounded-lg border px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary bg-white transition-all duration-fast focus:outline-none focus:ring-2',
                'border-border-medium focus:border-primary-400 focus:ring-primary-400',
                'min-h-[100px]'
              )}
              placeholder="Erzähle etwas über dich..."
            />
          </div>
        </div>
      </Modal>

      {/* Avatar Dialog */}
      <Modal
        isOpen={openDialog === 'avatar'}
        onClose={() => setOpenDialog(null)}
        title="Profilbild ändern"
        size="sm"
      >
        <div className="text-center">
          <div className="relative inline-block mb-4">
            {profile?.avatar_url && !imageError ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-32 h-32 rounded-full object-cover mx-auto"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary-200 flex items-center justify-center mx-auto">
                <span className="text-3xl font-bold text-primary-800">
                  {getInitials(profile?.full_name || null)}
                </span>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            fullWidth
          >
            <Camera size={18} />
            Bild auswählen
          </Button>

          <p className={cn(typography.caption, 'text-text-tertiary mt-2')}>
            Max. 2MB, JPG, PNG oder GIF
          </p>
        </div>
      </Modal>

      {/* Health Dialog */}
      <Modal
        isOpen={openDialog === 'health'}
        onClose={() => setOpenDialog(null)}
        title="Gesundheitsdaten bearbeiten"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenDialog(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveHealth} loading={healthLoading}>
              <Save size={18} />
              Speichern
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Alter"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
              placeholder="30"
              min="10"
              max="100"
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Geschlecht
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={cn(
                  'block w-full rounded-lg border px-4 py-2.5 text-base text-text-primary bg-white transition-all duration-fast focus:outline-none focus:ring-2',
                  'border-border-medium focus:border-primary-400 focus:ring-primary-400'
                )}
              >
                <option value="">Nicht angeben</option>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="other">Divers</option>
              </select>
            </div>

            <Input
              label="Größe (cm)"
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
              placeholder="175"
              min="100"
              max="250"
            />

            <Input
              label="Gewicht (kg)"
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
              placeholder="70"
              min="30"
              max="200"
            />

            <Input
              label="Ruhepuls (bpm)"
              type="number"
              value={restingHR}
              onChange={(e) => setRestingHR(e.target.value ? Number(e.target.value) : '')}
              placeholder="60"
              min="30"
              max="120"
            />

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Maximalpuls (bpm)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={maxHR}
                  onChange={(e) => setMaxHR(e.target.value ? Number(e.target.value) : '')}
                  placeholder="190"
                  min="100"
                  max="220"
                  className={cn(
                    'block w-full rounded-lg border px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary bg-white transition-all duration-fast focus:outline-none focus:ring-2',
                    'border-border-medium focus:border-primary-400 focus:ring-primary-400'
                  )}
                />
                <button
                  type="button"
                  onClick={handleEstimateMaxHR}
                  className="px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors whitespace-nowrap"
                  title="Max-Puls schätzen"
                >
                  <Zap size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-text-tertiary bg-blue-50 p-3 rounded-lg">
            💡 Diese Daten helfen, deine Trainingszonen präziser zu berechnen.
          </div>
        </div>
      </Modal>

      {/* Runner Profile Dialog */}
      <Modal
        isOpen={openDialog === 'runner'}
        onClose={() => setOpenDialog(null)}
        title="Läuferprofil bearbeiten"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenDialog(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveRunner} loading={runnerLoading}>
              <Save size={18} />
              Speichern
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Weiteste Distanz (km)"
            type="number"
            step="0.1"
            value={longestRunKm}
            onChange={(e) => setLongestRunKm(e.target.value ? Number(e.target.value) : '')}
            placeholder="21.1"
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Motivation & Ziele (optional)
            </label>
            <textarea
              value={motivationText}
              onChange={(e) => setMotivationText(e.target.value)}
              className={cn(
                'block w-full rounded-lg border px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary bg-white transition-all duration-fast focus:outline-none focus:ring-2',
                'border-border-medium focus:border-primary-400 focus:ring-primary-400',
                'min-h-[100px]'
              )}
              placeholder="Was motiviert dich zum Laufen?"
            />
          </div>
        </div>
      </Modal>

      {/* PBs Dialog */}
      <Modal
        isOpen={openDialog === 'pbs'}
        onClose={() => {
          setOpenDialog(null);
          setShowPBForm(false);
          setEditingPBIndex(null);
        }}
        title="Persönliche Bestzeiten"
        size="lg"
      >
        <div className="space-y-4">
          {/* Info Button for VDOT Details */}
          <button
            onClick={() => setOpenDialog('vdot-info')}
            className="flex items-center gap-2 text-sm text-primary-700 hover:text-primary-800 transition-colors"
          >
            <Info size={16} />
            Mehr über VDOT & Trainingszonen erfahren
          </button>

          {/* Add PB Button */}
          {!showPBForm && editingPBIndex === null && (
            <Button
              onClick={() => setShowPBForm(true)}
              variant="secondary"
              fullWidth
            >
              <Plus size={18} />
              Bestzeit hinzufügen
            </Button>
          )}

          {/* Add PB Form */}
          {showPBForm && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Neue Bestzeit</h4>
              <PersonalBestInput
                onSave={(pb: PersonalBest) => handleAddPB(pb)}
                onCancel={() => setShowPBForm(false)}
              />
            </div>
          )}

          {/* PBs List */}
          {runnerProfile && runnerProfile.personalBests.length > 0 && (
            <div className="space-y-2">
              {runnerProfile.personalBests.map((pb, index) => (
                <div key={index}>
                  {editingPBIndex === index ? (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold mb-3">Bestzeit bearbeiten</h4>
                      <PersonalBestInput
                        initialValue={pb}
                        onSave={(updatedPB: PersonalBest) => handleEditPB(index, updatedPB)}
                        onCancel={() => setEditingPBIndex(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="font-semibold text-primary-700 min-w-[60px]">
                          {getDistanceLabel(pb)}
                        </div>
                        <div className="font-mono font-medium">{pb.time}</div>
                        {pb.date && (
                          <div className="text-sm text-text-tertiary">
                            {new Date(pb.date).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingPBIndex(index)}
                          className="p-2 text-text-tertiary hover:text-text-primary hover:bg-white rounded-lg transition-colors"
                          aria-label="Bearbeiten"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeletePB(index)}
                          disabled={deletingPBIndex === index}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          aria-label="Löschen"
                        >
                          {deletingPBIndex === index ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {runnerProfile && runnerProfile.personalBests.length === 0 && !showPBForm && (
            <div className="text-center py-8 text-text-tertiary">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Noch keine Bestzeiten hinterlegt</p>
              <p className="text-xs mt-1">Füge deine erste Bestzeit hinzu!</p>
            </div>
          )}
        </div>
      </Modal>

      {/* VDOT Info Dialog */}
      <Modal
        isOpen={openDialog === 'vdot-info'}
        onClose={() => setOpenDialog('pbs')}
        title="VDOT & Trainingszonen"
        size="xl"
      >
        <div className="space-y-4">
          <div className="text-sm text-text-secondary mb-4">
            Hier findest du detaillierte Informationen zu deinem VDOT-Wert, Trainingszonen und personalisierten Empfehlungen basierend auf deinen Bestzeiten.
          </div>

          {runnerProfile && (
            <UserProfileManager
              profile={runnerProfile}
              onUpdateProfile={updateRunnerProfile}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
