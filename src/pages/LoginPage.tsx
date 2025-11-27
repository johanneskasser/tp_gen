import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { Button, Input, Alert } from '../components/ui';
import { typography, cn } from '../lib/designSystem';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
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
    <div className="min-h-screen flex">
      {/* Left Side - Image Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: 'url(/running-6252827_1920.jpg)' }}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 to-slate-900/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/img.png"
              alt="Logo"
              className="h-32 w-32 drop-shadow-2xl"
            />
          </div>

          {/* Branding Text */}
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold mb-4 drop-shadow-lg">
              {t('app.title')}
            </h1>
            <p className="text-lg text-slate-200 drop-shadow-md">
              {t('app.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="/img.png"
              alt="Logo"
              className="h-20 w-20"
            />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className={cn(typography.h1, 'mb-2 text-slate-900')}>
              {isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
            </h2>
            <p className={cn(typography.body, 'text-text-tertiary')}>
              {isSignUp
                ? t('auth.startTrainingJourney')
                : t('auth.loginToStart')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-5 h-5" />}
            />

            <Input
              id="password"
              type="password"
              label={t('auth.password')}
              placeholder={isSignUp ? t('auth.passwordPlaceholderSignUp') : t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              leftIcon={<Lock className="w-5 h-5" />}
              helperText={isSignUp ? t('auth.passwordHelperText') : undefined}
            />

            {/* Error Alert */}
            {error && (
              <Alert variant="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Success Alert */}
            {successMessage && (
              <Alert variant="success" onClose={() => setSuccessMessage('')}>
                {successMessage}
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              loading={loading}
              size="lg"
              className="mt-6"
            >
              {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
              {isSignUp ? t('auth.signUp') : t('auth.signIn')}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-8 text-center pt-6 border-t border-border-light">
            <p className={cn(typography.body, 'text-text-secondary mb-2')}>
              {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.noAccountYet')}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMessage('');
              }}
              className={cn(
                'text-primary-600 hover:text-primary-700 font-semibold',
                'transition-colors duration-fast underline underline-offset-2',
                typography.body
              )}
            >
              {isSignUp ? t('auth.signInNow') : t('auth.signUpFree')}
            </button>
          </div>

          {/* Mobile Footer */}
          <p className={cn(typography.caption, 'text-center text-text-tertiary mt-8 lg:hidden')}>
            {t('auth.personalTrainingPlan')}
          </p>
        </div>
      </div>
    </div>
  );
}
