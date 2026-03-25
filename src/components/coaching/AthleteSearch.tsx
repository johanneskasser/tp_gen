import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, CheckCircle } from 'lucide-react';
import { searchAthletesByUsernamePrefix, sendCoachingRequest } from '../../services/coachingService';
import { PublicAthleteProfile } from '../../types/coaching';
import { useToast } from '../../contexts/ToastContext';

interface AthleteSearchProps {
  onRequestSent: () => void;
}

type RequestStatus = 'idle' | 'loading' | 'sent' | 'already-sent';

function AvatarInitials({ name, username }: { name: string | null; username: string }) {
  const display = name || username;
  const initials = display
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {initials || '?'}
    </div>
  );
}

export function AthleteSearch({ onRequestSent }: AthleteSearchProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<PublicAthleteProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, RequestStatus>>({});

  const query = searchInput.replace(/^@/, '').trim();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset when input cleared
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  // Debounced prefix search
  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchAthletesByUsernamePrefix(query);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error searching for athlete:', err);
        setResults([]);
        setShowDropdown(true);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (athlete: PublicAthleteProfile) => {
    setRequestStatuses((prev) => ({ ...prev, [athlete.id]: 'loading' }));
    try {
      await sendCoachingRequest(athlete.id);
      setRequestStatuses((prev) => ({ ...prev, [athlete.id]: 'sent' }));
      toast.success(t('coaching.requestSent'));
      onRequestSent();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23505') {
        setRequestStatuses((prev) => ({ ...prev, [athlete.id]: 'already-sent' }));
      } else {
        console.error('Error sending coaching request:', err);
        toast.error(t('coaching.requestSent') + ' fehlgeschlagen');
        setRequestStatuses((prev) => ({ ...prev, [athlete.id]: 'idle' }));
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <span className="text-gray-400 font-medium text-sm select-none">@</span>
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={t('coaching.searchPlaceholder')}
          className="w-full pl-7 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          {isSearching
            ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            : <Search className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">{t('coaching.searchNoResult')}</div>
          ) : (
            results.map((athlete) => {
              const status = requestStatuses[athlete.id] ?? 'idle';
              const isSent = status === 'sent' || status === 'already-sent';
              return (
                <div key={athlete.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                  <AvatarInitials name={athlete.full_name} username={athlete.username} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {athlete.full_name || athlete.username}
                    </p>
                    <p className="text-xs text-gray-500">@{athlete.username}</p>
                  </div>
                  {isSent ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t('coaching.requestSent')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(athlete)}
                      disabled={status === 'loading'}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                    >
                      {status === 'loading' ? '...' : t('coaching.requestAccess')}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
