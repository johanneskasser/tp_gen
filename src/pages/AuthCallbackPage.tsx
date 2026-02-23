import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL (Supabase sends auth tokens in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            navigate('/?error=auth_failed');
            return;
          }

          // Successfully authenticated - redirect to dashboard
          navigate('/dashboard');
        } else {
          // No tokens found in URL
          console.error('No auth tokens found in URL');
          navigate('/?error=no_tokens');
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/?error=unknown');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
        <p className="text-white text-lg">
          {t('auth.verifyingLogin', 'Login wird verifiziert...')}
        </p>
      </div>
    </div>
  );
}
