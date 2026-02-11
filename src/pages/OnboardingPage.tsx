import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { PersonalBest, UserProfile } from '../types/userProfile';
import { Button, Card, Input } from '../components/ui';
import { typography, cn } from '../lib/designSystem';
import { ChevronRight, ChevronLeft, Check, Trophy, User as UserIcon, Rocket, Award } from 'lucide-react';
import { profileService } from '../services/profileService';
import { calculateVDOT } from '../utils/vdotCalculator';
import { PersonalBestInput } from '../components/PersonalBestInput';
import { PersonalBestCard } from '../components/PersonalBestCard';
import { validateTimeInput } from '../utils/timeValidator';

type RunnerLevel = 'beginner' | 'intermediate' | 'advanced';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { updateRunnerProfile } = useRunnerProfile();

  const [currentStep, setCurrentStep] = useState(1);
  const [runnerLevel, setRunnerLevel] = useState<RunnerLevel | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Runner Level
  const [selectedLevel, setSelectedLevel] = useState<RunnerLevel | null>(null);

  // Step 2: Personal Info & Biomarkers
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [heightCm, setHeightCm] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [restingHR, setRestingHR] = useState<number | ''>('');

  // Step 3a: For Experienced Runners - Personal Bests
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [showPBForm, setShowPBForm] = useState(false);

  // Step 3: Weekly KM (for all users)
  const [weeklyKm, setWeeklyKm] = useState<number>(10);

  // Step 3b: For Beginners - Max Distance/Time
  const [maxDistance, setMaxDistance] = useState<number>(5);
  const [maxTime, setMaxTime] = useState('');

  // Step 4: Motivation
  const [motivationCategories, setMotivationCategories] = useState<string[]>([]);
  const [motivationText, setMotivationText] = useState('');

  const totalSteps = 4;

  const handleLevelSelect = (level: RunnerLevel) => {
    setSelectedLevel(level);
    setRunnerLevel(level);

    // Set default weekly km based on level
    if (level === 'beginner') {
      setWeeklyKm(10);
    } else if (level === 'intermediate') {
      setWeeklyKm(30);
    } else {
      setWeeklyKm(50);
    }
  };

  const handleAddPB = (pb: PersonalBest) => {
    setPersonalBests([...personalBests, pb]);
    setShowPBForm(false);
  };

  const handleEditPB = (index: number, pb: PersonalBest) => {
    setPersonalBests(personalBests.map((existingPb, i) => (i === index ? pb : existingPb)));
  };

  const handleRemovePB = (index: number) => {
    setPersonalBests(personalBests.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return selectedLevel !== null;
    }
    if (currentStep === 2) {
      return fullName.trim().length > 0;
    }
    if (currentStep === 3) {
      // PBs are now optional for everyone
      return weeklyKm > 0;
    }
    if (currentStep === 4) {
      // Motivation is optional
      return true;
    }
    return false;
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // Update user profile (name, bio, biomarkers)
      await profileService.updateProfile(user.id, {
        full_name: fullName,
        bio: bio || null,
        age: age || null,
        gender: gender || null,
        height_cm: heightCm || null,
        weight_kg: weightKg || null,
        resting_heart_rate_bpm: restingHR || null,
        motivation_text: motivationText || null,
      });

      // Create runner profile
      let profile: Partial<UserProfile> = {
        id: user.id,
        name: fullName,
        personalBests: [],
        age: age || undefined,
        gender: gender || undefined,
        heightCm: heightCm || undefined,
        weightKg: weightKg || undefined,
        restingHeartRateBpm: restingHR || undefined,
        motivationText: motivationText || undefined,
      };

      if (runnerLevel === 'beginner') {
        // For beginners, create a synthetic PB based on max distance (if provided)
        if (maxTime) {
          const timeValidation = validateTimeInput(maxTime);
          const syntheticPB: PersonalBest = {
            distance: maxDistance === 5 ? '5K' : maxDistance === 10 ? '10K' : 'CUSTOM',
            customDistanceKm: maxDistance !== 5 && maxDistance !== 10 ? maxDistance : undefined,
            time: timeValidation.formattedTime || maxTime,
            date: new Date().toISOString().split('T')[0],
          };
          profile.personalBests = [syntheticPB];

          // Calculate initial VDOT
          try {
            profile.vdot = calculateVDOT(syntheticPB);
          } catch (error) {
            console.error('Error calculating VDOT:', error);
          }
        }
        profile.weeklyKmBase = weeklyKm;
        profile.longestRunKm = maxDistance;
        profile.yearsRunning = 0.5; // Assume beginner has been running for ~6 months
      } else {
        // For experienced runners, use PBs if provided
        profile.personalBests = personalBests.length > 0 ? personalBests : [];
        profile.weeklyKmBase = weeklyKm;
        profile.yearsRunning = runnerLevel === 'intermediate' ? 2 : 5;
      }

      // Save runner profile
      await updateRunnerProfile(profile as UserProfile);

      // Mark onboarding as completed
      await profileService.updateProfile(user.id, {
        onboarding_completed: true,
      });

      await refreshProfile();

      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className={cn(typography.h2, 'mb-2')}>Willkommen! 👋</h2>
              <p className={cn(typography.body, 'text-text-tertiary')}>
                Wie würdest du dein Lauferfahrung beschreiben?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleLevelSelect('beginner')}
                className={cn(
                  'p-6 rounded-xl border-2 transition-all text-left',
                  selectedLevel === 'beginner'
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-border-light hover:border-primary-300 bg-white'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    selectedLevel === 'beginner' ? 'bg-primary-700' : 'bg-slate-100'
                  )}>
                    <Rocket className={selectedLevel === 'beginner' ? 'text-white' : 'text-slate-600'} size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(typography.h3, 'mb-1')}>Laufanfänger 🌱</h3>
                    <p className={cn(typography.bodySmall, 'text-text-tertiary')}>
                      Ich fange gerade erst an oder laufe noch nicht regelmäßig
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleLevelSelect('intermediate')}
                className={cn(
                  'p-6 rounded-xl border-2 transition-all text-left',
                  selectedLevel === 'intermediate'
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-border-light hover:border-primary-300 bg-white'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    selectedLevel === 'intermediate' ? 'bg-primary-700' : 'bg-slate-100'
                  )}>
                    <UserIcon className={selectedLevel === 'intermediate' ? 'text-white' : 'text-slate-600'} size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(typography.h3, 'mb-1')}>Freizeitläufer 🏃</h3>
                    <p className={cn(typography.bodySmall, 'text-text-tertiary')}>
                      Ich laufe regelmäßig und habe bereits an Wettkämpfen teilgenommen
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleLevelSelect('advanced')}
                className={cn(
                  'p-6 rounded-xl border-2 transition-all text-left',
                  selectedLevel === 'advanced'
                    ? 'border-primary-700 bg-primary-50'
                    : 'border-border-light hover:border-primary-300 bg-white'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    selectedLevel === 'advanced' ? 'bg-primary-700' : 'bg-slate-100'
                  )}>
                    <Trophy className={selectedLevel === 'advanced' ? 'text-white' : 'text-slate-600'} size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(typography.h3, 'mb-1')}>Ambitionierter Läufer 💪</h3>
                    <p className={cn(typography.bodySmall, 'text-text-tertiary')}>
                      Ich trainiere strukturiert und habe klare Ziele
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className={cn(typography.h2, 'mb-2')}>Über dich</h2>
              <p className={cn(typography.body, 'text-text-tertiary')}>
                Diese Informationen helfen uns, dein Training optimal anzupassen
              </p>
            </div>

            <Input
              label="Vollständiger Name *"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="z.B. Max Mustermann"
              required
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
                  'min-h-[80px]'
                )}
                placeholder="Erzähle kurz über dich..."
              />
            </div>

            {/* Biomarkers Section */}
            <div className="pt-4 border-t border-border-light">
              <h3 className="text-base font-semibold text-text-secondary mb-4">
                Gesundheitsdaten (optional, aber empfohlen)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Alter
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:outline-none transition-all"
                    placeholder="z.B. 30"
                    min="10"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Geschlecht
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:outline-none transition-all"
                  >
                    <option value="">Nicht angeben</option>
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                    <option value="other">Divers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Größe (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:outline-none transition-all"
                    placeholder="z.B. 175"
                    min="100"
                    max="250"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Gewicht (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:outline-none transition-all"
                    placeholder="z.B. 70"
                    min="30"
                    max="200"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Ruhepuls (Schläge/Min)
                </label>
                <input
                  type="number"
                  value={restingHR}
                  onChange={(e) => setRestingHR(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:outline-none transition-all"
                  placeholder="z.B. 60"
                  min="30"
                  max="120"
                />
                <p className="text-xs text-text-tertiary mt-1.5">
                  💡 Miss deinen Puls morgens direkt nach dem Aufwachen
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Warum fragen wir das?</strong> Diese Daten helfen uns, deine Trainingszonen präziser zu berechnen und geschlechtsspezifische Empfehlungen zu geben.
              </p>
            </div>
          </div>
        );

      case 3:
        if (runnerLevel === 'beginner') {
          const timeValidation = validateTimeInput(maxTime);

          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className={cn(typography.h2, 'mb-2')}>Deine Ausgangssituation</h2>
                <p className={cn(typography.body, 'text-text-tertiary')}>
                  Das hilft uns, deinen Trainingsplan optimal anzupassen
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-3">
                  Was ist die längste Distanz, die du bisher gelaufen bist?
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 5, 7, 10, 15].map((distance) => (
                    <button
                      key={distance}
                      type="button"
                      onClick={() => setMaxDistance(distance)}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all font-medium',
                        'hover:scale-[1.02] active:scale-[0.98]',
                        maxDistance === distance
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-slate-200 bg-white hover:border-primary-300 text-slate-700'
                      )}
                    >
                      {distance} km
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  In welcher Zeit hast du diese Distanz geschafft?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={maxTime}
                    onChange={(e) => {
                      const value = e.target.value;
                      setMaxTime(value);
                    }}
                    placeholder="MM:SS oder HH:MM:SS"
                    className={cn(
                      'w-full px-4 py-3 rounded-lg border-2 transition-all',
                      'text-lg font-mono tracking-wider',
                      'focus:outline-none focus:ring-2 focus:ring-primary-400',
                      maxTime && !timeValidation.isValid
                        ? 'border-red-300 bg-red-50'
                        : maxTime && timeValidation.isValid
                        ? 'border-green-300 bg-green-50'
                        : 'border-slate-200 focus:border-primary-400'
                    )}
                  />
                  {maxTime && timeValidation.isValid && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                      <Check size={20} />
                    </div>
                  )}
                </div>
                <div className="mt-1.5 min-h-[20px]">
                  {maxTime && !timeValidation.isValid && timeValidation.error && (
                    <p className="text-xs text-red-600">{timeValidation.error}</p>
                  )}
                  {maxTime && timeValidation.isValid && (
                    <p className="text-xs text-green-600">Gültige Zeit</p>
                  )}
                  {!maxTime && (
                    <p className="text-xs text-slate-500">
                      Beispiele: 30:00 für 30 Minuten oder 1:15:30 für 1 Stunde 15 Minuten
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Wie viele Kilometer läufst du aktuell pro Woche?
                </label>
                <input
                  type="number"
                  value={weeklyKm}
                  onChange={(e) => setWeeklyKm(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:outline-none transition-all"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-text-tertiary mt-1.5">
                  Durchschnittliche Kilometer pro Woche
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-primary-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  💡 <strong>Tipp:</strong> Diese Informationen helfen uns, dein Fitnesslevel (VDOT) zu schätzen
                  und dir einen passenden Trainingsplan zu erstellen.
                </p>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className={cn(typography.h2, 'mb-2')}>Deine Bestzeiten</h2>
                <p className={cn(typography.body, 'text-text-tertiary')}>
                  Füge deine persönlichen Bestzeiten hinzu (optional)
                </p>
              </div>

              {/* Add PB Form */}
              {showPBForm && (
                <div className="p-5 bg-gradient-to-br from-blue-50 to-primary-50 border-2 border-primary-200 rounded-xl animate-in slide-in-from-top-2 duration-200">
                  <h4 className="text-base font-semibold text-slate-800 mb-4">Bestzeit hinzufügen</h4>
                  <PersonalBestInput
                    onSave={handleAddPB}
                    onCancel={() => setShowPBForm(false)}
                  />
                </div>
              )}

              {/* Existing PBs */}
              {personalBests.length > 0 ? (
                <div className="space-y-3">
                  {personalBests.map((pb, index) => (
                    <PersonalBestCard
                      key={index}
                      personalBest={pb}
                      onEdit={(updatedPb) => handleEditPB(index, updatedPb)}
                      onDelete={() => handleRemovePB(index)}
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
                    Du kannst Bestzeiten auch später im Profil hinzufügen
                  </p>
                </div>
              )}

              {/* Add PB Button (when form not shown) */}
              {!showPBForm && (
                <button
                  onClick={() => setShowPBForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <Trophy size={18} />
                  {personalBests.length > 0 ? 'Weitere Bestzeit hinzufügen' : 'Bestzeit hinzufügen'}
                </button>
              )}

              {personalBests.length === 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Keine Bestzeiten?</strong> Kein Problem! Du kannst trotzdem fortfahren. Wir schätzen dein Fitnesslevel dann basierend auf deiner wöchentlichen Laufleistung.
                  </p>
                </div>
              )}

              {/* Weekly KM for experienced runners */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  Wie viele Kilometer läufst du aktuell pro Woche? *
                </label>
                <input
                  type="number"
                  value={weeklyKm}
                  onChange={(e) => setWeeklyKm(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-400 focus:outline-none transition-all"
                  min="0"
                  max="200"
                  placeholder="z.B. 40"
                />
                <p className="text-xs text-text-tertiary mt-1.5">
                  Durchschnittliche Kilometer pro Woche
                </p>
              </div>
            </div>
          );
        }

      case 4:
        const motivationOptions = [
          { id: 'health', label: 'Gesundheit & Fitness', emoji: '💪' },
          { id: 'race', label: 'Wettkampfziele', emoji: '🏆' },
          { id: 'stress', label: 'Stressabbau', emoji: '🧘' },
          { id: 'weight', label: 'Gewichtsmanagement', emoji: '⚖️' },
          { id: 'community', label: 'Spaß & Community', emoji: '👥' },
          { id: 'challenge', label: 'Persönliche Herausforderung', emoji: '🎯' },
        ];

        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className={cn(typography.h2, 'mb-2')}>Was motiviert dich?</h2>
              <p className={cn(typography.body, 'text-text-tertiary')}>
                Wähle aus, was dich zum Laufen motiviert (Mehrfachauswahl möglich)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {motivationOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setMotivationCategories((prev) =>
                      prev.includes(option.id)
                        ? prev.filter((id) => id !== option.id)
                        : [...prev, option.id]
                    );
                  }}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    'hover:scale-[1.02] active:scale-[0.98]',
                    motivationCategories.includes(option.id)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-primary-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.emoji}</span>
                    <span className={cn(
                      'font-medium',
                      motivationCategories.includes(option.id)
                        ? 'text-primary-700'
                        : 'text-slate-700'
                    )}>
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Weitere Gedanken (optional)
              </label>
              <textarea
                value={motivationText}
                onChange={(e) => setMotivationText(e.target.value)}
                className={cn(
                  'block w-full rounded-lg border px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary bg-white transition-all duration-fast focus:outline-none focus:ring-2',
                  'border-border-medium focus:border-primary-400 focus:ring-primary-400',
                  'min-h-[100px]'
                )}
                placeholder="Erzähle mehr über deine Ziele und was dich antreibt..."
              />
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-900">
                🎉 <strong>Fast geschafft!</strong> Deine Antworten helfen uns, dir passende Trainingspläne und Motivationstipps zu geben.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card variant="default" className="w-full max-w-2xl">
        <div className="p-6 sm:p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">
                Schritt {currentStep} von {totalSteps}
              </span>
              <span className="text-sm font-medium text-primary-700">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-700 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-light">
            <Button
              onClick={handleBack}
              variant="secondary"
              disabled={currentStep === 1}
            >
              <ChevronLeft size={18} />
              Zurück
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              loading={loading}
            >
              {currentStep === totalSteps ? (
                <>
                  <Check size={18} />
                  Fertig
                </>
              ) : (
                <>
                  Weiter
                  <ChevronRight size={18} />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
