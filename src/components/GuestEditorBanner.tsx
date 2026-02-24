import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, HardDrive, ArrowRight, Lock } from 'lucide-react';
import { analytics } from '../utils/analytics';

export function GuestEditorBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-900 text-white border-b border-slate-700/50 relative z-40">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <HardDrive size={14} className="text-blue-400 flex-shrink-0" />
            <span className="text-white/70 text-xs sm:text-sm">
              Gast-Modus — Plan wird lokal im Browser gespeichert
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-white/40" />
            <span className="text-white/40 text-xs">Zum Veröffentlichen:</span>
            <Link
              to="/login"
              onClick={() => analytics.trackGuestSignupCTAClicked('banner')}
              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Anmelden
              <ArrowRight size={11} />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs hidden sm:block">
            PDF & JSON Export funktionieren ohne Anmeldung
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/40 hover:text-white/70 transition-colors p-1 rounded"
            aria-label="Banner schließen"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
