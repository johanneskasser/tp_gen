import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { Button, Input, Alert } from '../components/ui';
import { typography, cn } from '../lib/designSystem';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

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
          setSuccessMessage('Account erstellt! Bitte überprüfe deine E-Mail zur Bestätigung.');
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
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-primary-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-border-light">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={cn(typography.h1, 'mb-2')}>
              Trainingsplan Generator
            </h1>
            <p className={cn(typography.body, 'text-text-tertiary')}>
              {isSignUp ? 'Account erstellen' : 'Willkommen zurück'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="E-Mail"
              placeholder="deine@email.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-5 h-5" />}
            />

            <Input
              id="password"
              type="password"
              label="Passwort"
              placeholder={isSignUp ? 'Mindestens 6 Zeichen' : 'Dein Passwort'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              leftIcon={<Lock className="w-5 h-5" />}
              helperText={isSignUp ? 'Mindestens 6 Zeichen erforderlich' : undefined}
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
              leftIcon={isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
              size="lg"
              className="mt-6"
            >
              {isSignUp ? 'Registrieren' : 'Anmelden'}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center border-t border-border-light pt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMessage('');
              }}
              className={cn(
                'text-primary-700 hover:text-primary-800 font-medium',
                'transition-colors duration-fast',
                typography.body
              )}
            >
              {isSignUp ? 'Bereits registriert? Anmelden' : 'Noch kein Account? Registrieren'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className={cn(typography.caption, 'text-center text-text-tertiary mt-6')}>
          Dein persönlicher Trainingsplan für Laufevents
        </p>
      </div>
    </div>
  );
}
