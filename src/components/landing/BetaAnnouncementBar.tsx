import { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'beta_banner_dismissed';

export function BetaAnnouncementBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  useEffect(() => {
    if (!dismissed) {
      // Tiny delay so it slides in smoothly after mount
      const t = setTimeout(() => setVisible(true), 100);
      return () => clearTimeout(t);
    }
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  if (dismissed) return null;

  return (
    <div
      className={`w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-sm transition-all duration-500 ease-out overflow-hidden ${
        visible ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Zap size={14} className="text-yellow-400 shrink-0" />
          <span className="font-body text-white/90 truncate">
            zenit-it.fit ist jetzt in der <strong className="text-white">öffentlichen Beta</strong> — dein Feedback hilft uns enorm&nbsp;🙏
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/feedback"
            className="font-body font-semibold text-yellow-400 hover:text-yellow-300 transition-colors whitespace-nowrap text-xs"
          >
            Feedback geben →
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Banner schließen"
            className="p-2 text-white/50 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
