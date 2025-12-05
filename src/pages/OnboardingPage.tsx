import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { PersonalBest, UserProfile } from '../types/userProfile';
import { Button, Card, Input } from '../components/ui';
import { typography, cn } from '../lib/designSystem';
import { ChevronRight, ChevronLeft, Check, Trophy, User as UserIcon, Rocket } from 'lucide-react';
import { profileService } from '../services/profileService';
import { calculateVDOT } from '../utils/vdotCalculator';

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

  // Step 2: Personal Info
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  // Step 3a: For Experienced Runners - Personal Bests
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [pbForm, setPbForm] = useState<Partial<PersonalBest>>({
    distance: '10K',
    time: '',
  });

  // Step 3: Weekly KM (for all users)
  const [weeklyKm, setWeeklyKm] = useState<number>(10);

  // Step 3b: For Beginners - Max Distance/Time
  const [maxDistance, setMaxDistance] = useState<number>(5);
  const [maxTime, setMaxTime] = useState('');

  const totalSteps = 3;

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

  const handleAddPB = () => {
    if (!pbForm.time) {
      alert('Bitte Zeit eingeben');
      return;
    }

    const pb: PersonalBest = {
      distance: pbForm.distance as PersonalBest['distance'],
      time: pbForm.time,
      customDistanceKm: pbForm.customDistanceKm,
      date: new Date().toISOString().split('T')[0],
    };

    setPersonalBests([...personalBests, pb]);
    setPbForm({ distance: '10K', time: '' });
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
      if (runnerLevel === 'beginner') {
        return maxTime.length > 0 && weeklyKm > 0;
      } else {
        return personalBests.length > 0 && weeklyKm > 0;
      }
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
      // Update user profile (name, bio)
      await profileService.updateProfile(user.id, {
        full_name: fullName,
        bio: bio || null,
      });

      // Create runner profile
      let profile: Partial<UserProfile> = {
        id: user.id,
        name: fullName,
        personalBests: [],
      };

      if (runnerLevel === 'beginner') {
        // For beginners, create a synthetic PB based on max distance
        if (maxTime) {
          const syntheticPB: PersonalBest = {
            distance: maxDistance === 5 ? '5K' : maxDistance === 10 ? '10K' : 'CUSTOM',
            customDistanceKm: maxDistance !== 5 && maxDistance !== 10 ? maxDistance : undefined,
            time: maxTime,
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
        profile.yearsRunning = 0.5; // Assume beginner has been running for ~6 months
      } else {
        // For experienced runners
        profile.personalBests = personalBests;
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
                Erzähle uns ein bisschen über dich
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
                  'min-h-[100px]'
                )}
                placeholder="Erzähle etwas über deine Laufziele und Motivation..."
              />
            </div>
          </div>
        );

      case 3:
        if (runnerLevel === 'beginner') {
          return (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className={cn(typography.h2, 'mb-2')}>Deine Ausgangssituation</h2>
                <p className={cn(typography.body, 'text-text-tertiary')}>
                  Das hilft uns, deinen Trainingsplan optimal anzupassen
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Was ist die längste Distanz, die du bisher gelaufen bist? *
                </label>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-400"
                >
                  <option value="1">1 km</option>
                  <option value="2">2 km</option>
                  <option value="3">3 km</option>
                  <option value="5">5 km</option>
                  <option value="7">7 km</option>
                  <option value="10">10 km</option>
                  <option value="15">15 km</option>
                </select>
              </div>

              <Input
                label="In welcher Zeit hast du diese Distanz geschafft? *"
                type="text"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                placeholder="z.B. 30:00 (MM:SS) oder 1:30:00 (HH:MM:SS)"
                helperText="Format: MM:SS für unter einer Stunde, oder HH:MM:SS"
                required
              />

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Wie viele Kilometer läufst du aktuell pro Woche?
                </label>
                <input
                  type="number"
                  value={weeklyKm}
                  onChange={(e) => setWeeklyKm(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-400"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Durchschnittliche Kilometer pro Woche
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                  Füge deine persönlichen Bestzeiten hinzu
                </p>
              </div>

              {/* Existing PBs */}
              {personalBests.length > 0 && (
                <div className="space-y-2">
                  {personalBests.map((pb, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200"
                    >
                      <div>
                        <div className="font-medium text-slate-800">
                          {pb.distance === 'CUSTOM' ? `${pb.customDistanceKm}km` : pb.distance}
                        </div>
                        <div className="text-sm text-slate-600">Zeit: {pb.time}</div>
                      </div>
                      <button
                        onClick={() => handleRemovePB(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add PB Form */}
              <Card variant="default" className="p-4">
                <h3 className={cn(typography.h4, 'mb-3')}>Bestzeit hinzufügen</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Distanz
                    </label>
                    <select
                      value={pbForm.distance}
                      onChange={(e) => setPbForm({ ...pbForm, distance: e.target.value as PersonalBest['distance'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="5K">5K</option>
                      <option value="10K">10K</option>
                      <option value="HALF_MARATHON">Halbmarathon</option>
                      <option value="MARATHON">Marathon</option>
                    </select>
                  </div>

                  <Input
                    label="Zeit"
                    type="text"
                    value={pbForm.time || ''}
                    onChange={(e) => setPbForm({ ...pbForm, time: e.target.value })}
                    placeholder="z.B. 45:30 oder 3:30:00"
                  />

                  <Button onClick={handleAddPB} variant="secondary" fullWidth size="sm">
                    + Bestzeit hinzufügen
                  </Button>
                </div>
              </Card>

              {personalBests.length === 0 && (
                <div className="text-center text-sm text-text-tertiary">
                  Füge mindestens eine Bestzeit hinzu, um fortzufahren
                </div>
              )}

              {/* Weekly KM for experienced runners */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Wie viele Kilometer läufst du aktuell pro Woche? *
                </label>
                <input
                  type="number"
                  value={weeklyKm}
                  onChange={(e) => setWeeklyKm(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-border-medium focus:border-primary-400 focus:ring-2 focus:ring-primary-400"
                  min="0"
                  max="200"
                  placeholder="z.B. 40"
                />
                <p className="text-xs text-text-tertiary mt-1">
                  Durchschnittliche Kilometer pro Woche
                </p>
              </div>
            </div>
          );
        }

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
