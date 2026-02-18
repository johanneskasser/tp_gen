import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { feedbackService } from '../services/feedbackService';
import { useToast } from '../contexts/ToastContext';
import StarRating from '../components/feedback/StarRating';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

const STORAGE_KEY = 'feedback_draft';

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

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
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
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Save draft to localStorage on change
  useEffect(() => {
    if (hasInteracted) {
      const draft = {
        overallRating,
        featuresRating,
        editorRating,
        marketplaceRating,
        individualFeedback,
        featureSuggestion,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [
    overallRating,
    featuresRating,
    editorRating,
    marketplaceRating,
    individualFeedback,
    featureSuggestion,
    hasInteracted,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      error(t('auth.loginToStart'));
      return;
    }

    // Mark as interacted
    setHasInteracted(true);

    // Validate at least one field is filled
    const hasRating = overallRating || featuresRating || editorRating || marketplaceRating;
    const hasText = individualFeedback.trim() || featureSuggestion.trim();

    if (!hasRating && !hasText) {
      error(t('feedback.validation.atLeastOne'));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await feedbackService.submitFeedback(user.id, {
        overallRating: overallRating ?? undefined,
        featuresRating: featuresRating ?? undefined,
        editorRating: editorRating ?? undefined,
        marketplaceRating: marketplaceRating ?? undefined,
        individualFeedback: individualFeedback.trim() || undefined,
        featureSuggestion: featureSuggestion.trim() || undefined,
      });

      if (result.success) {
        // Clear form and localStorage
        setOverallRating(null);
        setFeaturesRating(null);
        setEditorRating(null);
        setMarketplaceRating(null);
        setIndividualFeedback('');
        setFeatureSuggestion('');
        localStorage.removeItem(STORAGE_KEY);

        // Show success modal
        setShowSuccess(true);
      } else {
        error(result.error || t('feedback.errors.generic'));
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      error(t('feedback.errors.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/dashboard');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient">
        <div className="max-w-md w-full">
          <div
            className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700"
            style={{ animationFillMode: 'backwards' }}
          >
            {/* Animated success icon */}
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-2xl animate-pulse" />
              <div
                className="relative bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-6 shadow-2xl animate-in zoom-in duration-500"
                style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
              >
                <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Success text */}
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

            {/* Back button */}
            <Button
              onClick={handleSuccessClose}
              size="lg"
              className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
            >
              {t('feedback.success.backToDashboard')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
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

            {/* Rating Cards */}
            <Card
              className="p-6 border-2 border-slate-200/60 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-left-4"
              style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">
                    {t('feedback.ratings.overall')}
                  </h3>
                  <p className="text-sm text-slate-500">{t('feedback.ratings.overallDesc')}</p>
                </div>
                <StarRating
                  value={overallRating}
                  onChange={(val) => {
                    setOverallRating(val);
                    setHasInteracted(true);
                  }}
                  size="lg"
                />
              </div>
            </Card>

            <Card
              className="p-6 border-2 border-slate-200/60 hover:border-purple-300 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-left-4"
              style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">
                    {t('feedback.ratings.features')}
                  </h3>
                  <p className="text-sm text-slate-500">{t('feedback.ratings.featuresDesc')}</p>
                </div>
                <StarRating
                  value={featuresRating}
                  onChange={(val) => {
                    setFeaturesRating(val);
                    setHasInteracted(true);
                  }}
                  size="lg"
                />
              </div>
            </Card>

            <Card
              className="p-6 border-2 border-slate-200/60 hover:border-pink-300 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-left-4"
              style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">
                    {t('feedback.ratings.editor')}
                  </h3>
                  <p className="text-sm text-slate-500">{t('feedback.ratings.editorDesc')}</p>
                </div>
                <StarRating
                  value={editorRating}
                  onChange={(val) => {
                    setEditorRating(val);
                    setHasInteracted(true);
                  }}
                  size="lg"
                />
              </div>
            </Card>

            <Card
              className="p-6 border-2 border-slate-200/60 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-left-4"
              style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">
                    {t('feedback.ratings.marketplace')}
                  </h3>
                  <p className="text-sm text-slate-500">{t('feedback.ratings.marketplaceDesc')}</p>
                </div>
                <StarRating
                  value={marketplaceRating}
                  onChange={(val) => {
                    setMarketplaceRating(val);
                    setHasInteracted(true);
                  }}
                  size="lg"
                />
              </div>
            </Card>
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
                onChange={(e) => {
                  setIndividualFeedback(e.target.value);
                  setHasInteracted(true);
                }}
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
                onChange={(e) => {
                  setFeatureSuggestion(e.target.value);
                  setHasInteracted(true);
                }}
                placeholder={t('feedback.suggestions.placeholder')}
                rows={5}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
          </Card>

          {/* Submit Button */}
          <div
            className="pt-6 animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}
          >
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
