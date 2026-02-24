import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Sparkles, Send, CheckCircle2, Lock, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { feedbackService } from '../services/feedbackService';
import { useToast } from '../contexts/ToastContext';
import StarRating from '../components/feedback/StarRating';
import { Card, Button } from '../components/ui';

const STORAGE_KEY = 'feedback_draft';
const SUBMITTED_KEY = 'feedback_submitted';

/** Fetch the client's public IP via ipify (lightweight, privacy-safe, no tracking) */
async function fetchClientIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
    const json = await res.json();
    return json.ip ?? null;
  } catch {
    return null;
  }
}

export default function FeedbackPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { error } = useToast();
  const navigate = useNavigate();

  // Form state
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [featuresRating, setFeaturesRating] = useState<number | null>(null);
  const [editorRating, setEditorRating] = useState<number | null>(null);
  const [marketplaceRating, setMarketplaceRating] = useState<number | null>(null);
  const [individualFeedback, setIndividualFeedback] = useState('');
  const [featureSuggestion, setFeatureSuggestion] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [anonymousEmail, setAnonymousEmail] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [clientIp, setClientIp] = useState<string | null>(null);

  // On mount: check localStorage + fetch IP in parallel
  useEffect(() => {
    if (localStorage.getItem(SUBMITTED_KEY) === 'true') {
      setAlreadySubmitted(true);
    }
    fetchClientIp().then(setClientIp);

    // Load draft
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setOverallRating(parsed.overallRating ?? null);
        setFeaturesRating(parsed.featuresRating ?? null);
        setEditorRating(parsed.editorRating ?? null);
        setMarketplaceRating(parsed.marketplaceRating ?? null);
        setIndividualFeedback(parsed.individualFeedback ?? '');
        setFeatureSuggestion(parsed.featureSuggestion ?? '');
        setAnonymousName(parsed.anonymousName ?? '');
        setAnonymousEmail(parsed.anonymousEmail ?? '');
      } catch {
        // ignore malformed draft
      }
    }
  }, []);

  // Save draft
  useEffect(() => {
    if (hasInteracted) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          overallRating,
          featuresRating,
          editorRating,
          marketplaceRating,
          individualFeedback,
          featureSuggestion,
          anonymousName,
          anonymousEmail,
        })
      );
    }
  }, [
    overallRating, featuresRating, editorRating, marketplaceRating,
    individualFeedback, featureSuggestion, anonymousName, anonymousEmail, hasInteracted,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasInteracted(true);

    // Client-side guard: already submitted
    if (alreadySubmitted) return;

    const hasRating = overallRating || featuresRating || editorRating || marketplaceRating;
    const hasText = individualFeedback.trim() || featureSuggestion.trim();

    if (!hasRating && !hasText) {
      error(t('feedback.validation.atLeastOne'));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await feedbackService.submitFeedback(user?.id ?? null, {
        overallRating: overallRating ?? undefined,
        featuresRating: featuresRating ?? undefined,
        editorRating: editorRating ?? undefined,
        marketplaceRating: marketplaceRating ?? undefined,
        individualFeedback: individualFeedback.trim() || undefined,
        featureSuggestion: featureSuggestion.trim() || undefined,
        anonymousName: anonymousName.trim() || undefined,
        anonymousEmail: anonymousEmail.trim() || undefined,
        ipAddress: clientIp ?? undefined,
      });

      if (result.success) {
        // Clear draft, set submitted flag
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(SUBMITTED_KEY, 'true');
        setAlreadySubmitted(true);

        // Reset form
        setOverallRating(null);
        setFeaturesRating(null);
        setEditorRating(null);
        setMarketplaceRating(null);
        setIndividualFeedback('');
        setFeatureSuggestion('');

        setShowSuccess(true);
      } else {
        error(result.error || t('feedback.errors.generic'));
      }
    } catch {
      error(t('feedback.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate(user ? '/dashboard' : '/');
  };

  // ── Already submitted ─────────────────────────────────────────────────────
  if (alreadySubmitted && !showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Feedback bereits eingereicht</h1>
          <p className="text-slate-600">
            Du hast bereits Feedback eingereicht — herzlichen Dank! Deine Meinung hilft uns,
            den zenit-it.fit zu verbessern.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-md w-full">
          <div
            className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700"
            style={{ animationFillMode: 'backwards' }}
          >
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-2xl animate-pulse" />
              <div
                className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-6 shadow-2xl animate-in zoom-in duration-500"
                style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
              >
                <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
            </div>

            <div
              className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {t('feedback.success.title')} 🎉
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                {t('feedback.success.message')}
              </p>
            </div>

            <Button
              onClick={handleSuccessClose}
              size="lg"
              className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
            >
              {user ? t('feedback.success.backToDashboard') : 'Zur Startseite'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Back link */}
        <div className="mb-6">
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            ← Zurück zur Startseite
          </Link>
        </div>

        {/* Auth status banner */}
        {user ? (
          <div className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <UserCircle className="w-4 h-4 shrink-0" />
            <span>Eingeloggt als <strong>{user.email}</strong></span>
          </div>
        ) : (
          <div className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Dein Feedback wird anonym eingereicht.{' '}
              <Link to="/login" className="text-blue-600 hover:underline">Einloggen</Link>
              {' '}um es mit deinem Konto zu verknüpfen.
            </span>
          </div>
        )}

        {/* Hero */}
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-top-6 duration-700">
          <div className="inline-flex items-center gap-2 text-5xl sm:text-6xl mb-2">
            <Heart className="w-12 h-12 sm:w-14 sm:h-14 text-blue-500 animate-pulse" fill="currentColor" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            {t('feedback.hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('feedback.hero.description')}
          </p>
          <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t('feedback.hero.thankYou')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div
            className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                {t('feedback.ratings.title')}
              </h2>
              <p className="text-sm text-slate-500">{t('feedback.ratings.description')}</p>
            </div>

            {[
              {
                label: t('feedback.ratings.overall'),
                desc: t('feedback.ratings.overallDesc'),
                value: overallRating,
                onChange: setOverallRating,
                color: 'hover:border-blue-300',
                delay: '200ms',
              },
              {
                label: t('feedback.ratings.features'),
                desc: t('feedback.ratings.featuresDesc'),
                value: featuresRating,
                onChange: setFeaturesRating,
                color: 'hover:border-purple-300',
                delay: '300ms',
              },
              {
                label: t('feedback.ratings.editor'),
                desc: t('feedback.ratings.editorDesc'),
                value: editorRating,
                onChange: setEditorRating,
                color: 'hover:border-pink-300',
                delay: '400ms',
              },
              {
                label: t('feedback.ratings.marketplace'),
                desc: t('feedback.ratings.marketplaceDesc'),
                value: marketplaceRating,
                onChange: setMarketplaceRating,
                color: 'hover:border-indigo-300',
                delay: '500ms',
              },
            ].map(({ label, desc, value, onChange, color, delay }) => (
              <Card
                key={label}
                className={`p-6 border-2 border-slate-200/60 ${color} hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-left-4`}
                style={{ animationDelay: delay, animationFillMode: 'backwards' }}
              >
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-lg">{label}</h3>
                    <p className="text-sm text-slate-500">{desc}</p>
                  </div>
                  <StarRating
                    value={value}
                    onChange={(val) => { onChange(val); setHasInteracted(true); }}
                    size="lg"
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Freeform Feedback */}
          <Card
            className="p-6 border-2 border-slate-200/60 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg mb-1">
                  {t('feedback.freeform.title')}
                </h3>
                <p className="text-sm text-slate-500">{t('feedback.freeform.helperText')}</p>
              </div>
              <textarea
                value={individualFeedback}
                onChange={(e) => { setIndividualFeedback(e.target.value); setHasInteracted(true); }}
                placeholder={t('feedback.freeform.placeholder')}
                rows={5}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </Card>

          {/* Feature Suggestions */}
          <Card
            className="p-6 border-2 border-slate-200/60 hover:border-purple-300 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '700ms', animationFillMode: 'backwards' }}
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg mb-1">
                  {t('feedback.suggestions.title')}
                </h3>
                <p className="text-sm text-slate-500">{t('feedback.suggestions.helperText')}</p>
              </div>
              <textarea
                value={featureSuggestion}
                onChange={(e) => { setFeatureSuggestion(e.target.value); setHasInteracted(true); }}
                placeholder={t('feedback.suggestions.placeholder')}
                rows={5}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </Card>

          {/* Optional contact fields */}
          <Card
            className="p-6 border-2 border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '750ms', animationFillMode: 'backwards' }}
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg mb-1">
                  Kontaktdaten <span className="text-sm font-normal text-slate-400">(optional)</span>
                </h3>
                <p className="text-sm text-slate-500">
                  Falls wir Rückfragen haben oder dich über Verbesserungen informieren dürfen.
                  Nur ausfüllen, wenn du möchtest.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={anonymousName}
                    onChange={(e) => { setAnonymousName(e.target.value); setHasInteracted(true); }}
                    placeholder="z.B. Max Mustermann"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all duration-200 text-slate-700 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-Mail</label>
                  <input
                    type="email"
                    value={anonymousEmail}
                    onChange={(e) => { setAnonymousEmail(e.target.value); setHasInteracted(true); }}
                    placeholder="deine@email.at"
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all duration-200 text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div
            className="pt-6 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}
          >
            <p className="text-center text-xs text-slate-400 mb-4">
              Du kannst Feedback nur einmal einreichen. Deine IP-Adresse wird zur Missbrauchsprävention gespeichert.
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-14"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('feedback.submitting')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  {t('feedback.submit')}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
