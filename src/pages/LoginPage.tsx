import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, Calendar } from 'lucide-react';
import { Button, Input, Alert } from '../components/ui';
import { cn } from '../lib/designSystem';
import { useTranslation } from 'react-i18next';
import { OAuthButtons } from '../components/OAuthButtons';

// Training session types for the animated visualization
const sessionTypes = [
  { type: 'easy', label: 'Locker', color: 'bg-blue-500', size: 'w-3 h-16' },
  { type: 'intervals', label: 'Intervall', color: 'bg-orange-500', size: 'w-3 h-24' },
  { type: 'rest', label: 'Ruhe', color: 'bg-slate-300', size: 'w-3 h-4' },
  { type: 'tempo', label: 'Tempo', color: 'bg-purple-500', size: 'w-3 h-20' },
  { type: 'easy', label: 'Locker', color: 'bg-blue-500', size: 'w-3 h-12' },
  { type: 'long', label: 'Lang', color: 'bg-green-500', size: 'w-3 h-28' },
  { type: 'rest', label: 'Ruhe', color: 'bg-slate-300', size: 'w-3 h-4' },
];

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);

  const { signIn, signUp, signInWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    const barsTimer = setTimeout(() => setBarsAnimated(true), 800);
    return () => {
      clearTimeout(timer);
      clearTimeout(barsTimer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (useMagicLink) {
        const { error } = await signInWithMagicLink(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage(t('auth.magicLinkSent', 'Ein Login-Link wurde an deine E-Mail gesendet. Bitte prüfe dein Postfach.'));
          setEmail('');
        }
      } else if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage(t('auth.accountCreatedSuccess'));
          setEmail('');
          setPassword('');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(t('auth.errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="currentColor" className="text-primary-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>
        {/* Gradient orbs - smaller on mobile */}
        <div className="absolute top-10 right-1/4 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse-ring" />
        <div className="absolute bottom-10 left-1/4 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-green-400/10 rounded-full blur-3xl animate-pulse-ring" style={{ animationDelay: '1s' }} />
      </div>

      {/* Left Side - Animated Illustration (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        {/* Main visualization container */}
        <div
          className={cn(
            'relative w-full max-w-lg transition-all duration-1000',
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          )}
        >
          {/* Background glow */}
          <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-primary-500/15 to-green-500/20 rounded-3xl blur-3xl" />

          {/* Central Card - Training Week Preview */}
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                  <Calendar size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-primary-900">Deine Trainingswoche</h3>
                  <p className="text-xs text-slate-500 font-body">Woche 8 von 16</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-200 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-700 font-body">On Track</span>
              </div>
            </div>

            {/* Weekly Bar Chart Visualization */}
            <div className="flex items-end justify-between gap-2 h-40 mb-6 px-2">
              {sessionTypes.map((session, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      session.color,
                      'w-8 rounded-t-lg transition-all duration-700 ease-out origin-bottom',
                      barsAnimated ? 'opacity-100' : 'opacity-0'
                    )}
                    style={{
                      height: barsAnimated ? `${parseInt(session.size.split('h-')[1]) * 4}px` : '0px',
                      transitionDelay: `${index * 100}ms`,
                    }}
                  />
                  <span className="text-[10px] font-medium text-slate-400 font-body">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][index]}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold font-mono text-primary-900">52</div>
                <div className="text-xs text-slate-500 font-body">km geplant</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold font-mono text-orange-600">4</div>
                <div className="text-xs text-slate-500 font-body">Sessions</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold font-mono text-green-600">68%</div>
                <div className="text-xs text-slate-500 font-body">Intensität</div>
              </div>
            </div>

            {/* Decorative gradient line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-primary-500 to-green-500" />
          </div>

          {/* Floating Badge - Top Right */}
          <div
            className={cn(
              'absolute -top-3 -right-3 transition-all duration-700',
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            )}
            style={{ transitionDelay: '1000ms' }}
          >
            <div className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg font-body font-semibold text-sm animate-float-gentle">
              Marathon 2025
            </div>
          </div>

          {/* Floating Badge - Bottom Left */}
          <div
            className={cn(
              'absolute -bottom-3 -left-3 transition-all duration-700',
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            )}
            style={{ transitionDelay: '1200ms' }}
          >
            <div className="px-4 py-2 bg-white border border-green-200 text-green-700 rounded-xl shadow-lg font-body font-semibold text-sm flex items-center gap-2 animate-float-gentle" style={{ animationDelay: '500ms' }}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              iCal Sync
            </div>
          </div>

          {/* Logo Badge */}
          <div
            className={cn(
              'absolute -top-4 left-1/2 -translate-x-1/2 transition-all duration-700',
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
            )}
            style={{ transitionDelay: '1200ms' }}
          >
            <div className="px-5 py-2.5 bg-white rounded-full shadow-xl border border-slate-100 flex items-center gap-2">
              <img
                src="/zenit-it_long_black.png"
                alt="zenit-it"
                className="h-6 w-auto"
              />
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-12 -right-12 w-32 h-32 border-2 border-dashed border-primary-200/40 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 border-2 border-dashed border-green-200/40 rounded-full" />
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex flex-1 items-center justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-12 relative z-10">
        <div
          className={cn(
            'max-w-md w-full transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Form Card */}
          <div className="bg-white/90 sm:bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg sm:shadow-xl border border-slate-200/60 overflow-hidden">
            {/* Logo Header */}
            <div className="flex justify-center py-4 sm:py-6 border-b border-slate-100 bg-white/50">
              <img
                src="/zenit-it_long_black.png"
                alt="zenit-it"
                className="h-7 sm:h-8 w-auto"
              />
            </div>

            {/* Form Content */}
            <div className="p-5 sm:p-6 lg:p-8">
              {/* Header with smooth transition */}
              <div className="mb-6 sm:mb-8 relative overflow-hidden">
                <div
                  className={cn(
                    'transition-all duration-500 ease-out',
                    isSignUp ? 'opacity-0 -translate-y-full absolute inset-0' : 'opacity-100 translate-y-0'
                  )}
                >
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary-900 mb-1 sm:mb-2">
                    {t('auth.welcomeBack')}
                  </h2>
                  <p className="font-body text-sm sm:text-base text-text-secondary">
                    {t('auth.loginToStart')}
                  </p>
                </div>
                <div
                  className={cn(
                    'transition-all duration-500 ease-out',
                    isSignUp ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full absolute inset-0'
                  )}
                >
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-primary-900 mb-1 sm:mb-2">
                    {t('auth.createAccount')}
                  </h2>
                  <p className="font-body text-sm sm:text-base text-text-secondary">
                    {t('auth.startTrainingJourney')}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="transition-all duration-300 ease-out">
                  <Input
                    id="email"
                    type="email"
                    label={t('auth.email')}
                    placeholder={t('auth.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    leftIcon={<Mail className="w-4 h-4 sm:w-5 sm:h-5" />}
                  />
                </div>

                <div
                  className={cn(
                    'transition-all duration-300 ease-out overflow-hidden',
                    !useMagicLink ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <Input
                    id="password"
                    type="password"
                    label={t('auth.password')}
                    placeholder={isSignUp ? t('auth.passwordPlaceholderSignUp') : t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!useMagicLink}
                    minLength={6}
                    leftIcon={<Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
                    helperText={isSignUp ? t('auth.passwordHelperText') : undefined}
                  />
                </div>

                <div
                  className={cn(
                    'transition-all duration-300 ease-out overflow-hidden',
                    !isSignUp ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setUseMagicLink(!useMagicLink);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className={cn(
                      'text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-body font-medium',
                      'transition-colors duration-fast hover:underline underline-offset-2'
                    )}
                  >
                    {useMagicLink
                      ? t('auth.usePassword', 'Mit Passwort anmelden')
                      : t('auth.useMagicLink', 'Ohne Passwort anmelden (Magic Link)')}
                  </button>
                </div>

                {/* Error Alert */}
                <div
                  className={cn(
                    'transition-all duration-300 ease-out overflow-hidden',
                    error ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  {error && (
                    <Alert variant="error" onClose={() => setError('')}>
                      {error}
                    </Alert>
                  )}
                </div>

                {/* Success Alert */}
                <div
                  className={cn(
                    'transition-all duration-300 ease-out overflow-hidden',
                    successMessage ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  {successMessage && (
                    <Alert variant="success" onClose={() => setSuccessMessage('')}>
                      {successMessage}
                    </Alert>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  size="lg"
                  className="mt-4 sm:mt-6 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] sm:hover:-translate-y-0.5"
                >
                  <span className="flex items-center justify-center gap-2">
                    {useMagicLink ? (
                      <Mail size={18} className="sm:w-5 sm:h-5" />
                    ) : isSignUp ? (
                      <UserPlus size={18} className="sm:w-5 sm:h-5" />
                    ) : (
                      <LogIn size={18} className="sm:w-5 sm:h-5" />
                    )}
                    <span className="text-sm sm:text-base">
                      {useMagicLink
                        ? t('auth.sendMagicLink', 'Magic Link senden')
                        : isSignUp
                          ? t('auth.signUp')
                          : t('auth.signIn')}
                    </span>
                  </span>
                </Button>
              </form>

              {/* OAuth Buttons */}
              <OAuthButtons className="mt-5 sm:mt-6" />

              {/* Toggle Sign Up / Sign In */}
              <div className="mt-6 sm:mt-8 text-center pt-5 sm:pt-6 border-t border-slate-100">
                <p className="font-body text-text-secondary text-sm mb-1 sm:mb-2 transition-all duration-300">
                  {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.noAccountYet')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setUseMagicLink(false);
                    setError('');
                    setSuccessMessage('');
                  }}
                  className={cn(
                    'text-primary-600 hover:text-primary-700 font-semibold font-body text-sm sm:text-base',
                    'transition-all duration-300 hover:underline underline-offset-2 active:scale-95 sm:hover:scale-105'
                  )}
                >
                  {isSignUp ? t('auth.signInNow') : t('auth.signUpFree')}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Footer */}
          <p className="text-center text-text-tertiary mt-6 lg:hidden text-xs sm:text-sm font-body">
            {t('auth.personalTrainingPlan')}
          </p>
        </div>
      </div>
    </div>
  );
}
