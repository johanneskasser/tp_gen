import { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, TrendingUp, Clock, Star, Copy, Users } from 'lucide-react';
import { cn } from '../../lib/designSystem';

interface Command {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const COMMANDS: Command[] = [
  { value: 'recent', label: '/recent', icon: <Clock size={16} />, description: 'Neueste Pläne' },
  { value: 'popular', label: '/popular', icon: <TrendingUp size={16} />, description: 'Beliebte Pläne' },
  { value: 'rating', label: '/rating', icon: <Star size={16} />, description: 'Beste Bewertung' },
  { value: 'clones', label: '/clones', icon: <Copy size={16} />, description: 'Meist kopiert' },
  { value: 'friends', label: '/friends', icon: <Users size={16} />, description: 'Von Freunden' },
];

interface ActiveFilter {
  id: string;
  label: string;
  onRemove: () => void;
}

interface CommandPaletteSearchProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCommandSelect: (command: string) => void;
  activeFilters: ActiveFilter[];
  onFilterClick: () => void;
  activeCommand?: string;
  onClearCommand?: () => void;
}

export function CommandPaletteSearch({
  searchValue,
  onSearchChange,
  onCommandSelect,
  activeFilters,
  onFilterClick,
  activeCommand,
  onClearCommand,
}: CommandPaletteSearchProps) {
  const [showCommands, setShowCommands] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandsRef = useRef<HTMLDivElement>(null);

  // Show commands when input starts with "/"
  useEffect(() => {
    if (searchValue.startsWith('/') && isFocused) {
      setShowCommands(true);
      setSelectedIndex(0);
    } else {
      setShowCommands(false);
    }
  }, [searchValue, isFocused]);

  // Close commands when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandsRef.current &&
        !commandsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowCommands(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleCommandClick = (command: Command) => {
    // Fill the command into the input
    onSearchChange(command.label);
    setShowCommands(false);

    // Trigger the command action after a brief delay
    setTimeout(() => {
      onCommandSelect(command.value);
      onSearchChange('');
      inputRef.current?.focus();
    }, 120);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showCommands || filteredCommands.length === 0) {
      if (e.key === 'Escape') {
        onSearchChange('');
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleCommandClick(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowCommands(false);
        onSearchChange('');
        break;
    }
  };

  return (
    <div className="relative w-full">
      {/* Main Search Bar - Brutally Minimal & Mobile-Optimized */}
      <div className="flex items-center gap-3 sm:gap-6 group">
        {/* Search Icon - Smaller on Mobile */}
        <Search
          className={cn(
            'flex-shrink-0 transition-all duration-500 ease-out',
            'w-5 h-5 sm:w-[26px] sm:h-[26px]',
            isFocused ? 'text-gray-900 scale-105' : 'text-gray-400'
          )}
          strokeWidth={1.5}
        />

        {/* Input Field - Completely Borderless, Responsive Typography */}
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Suche nach Trainingsplänen..."
          className={cn(
            'flex-1 outline-none bg-transparent border-none',
            'text-xl sm:text-3xl font-light text-gray-900 placeholder:text-gray-300',
            'transition-all duration-300 ease-out',
            'tracking-tight leading-tight',
            'py-1.5 sm:py-2',
            'focus:outline-none focus:ring-0 focus:border-none',
            isFocused && 'placeholder:text-gray-200'
          )}
          style={{
            fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            caretColor: '#000',
            boxShadow: 'none',
          }}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Filter Button - Ultra Minimal, No Focus Ring on Mobile */}
        <button
          onClick={onFilterClick}
          className={cn(
            'flex-shrink-0 p-2 sm:p-2.5 rounded-lg',
            'hover:bg-gray-100 active:bg-gray-150',
            'transition-all duration-200 ease-out',
            'focus:outline-none sm:focus:ring-2 sm:focus:ring-gray-900 sm:focus:ring-offset-2',
            'group/btn'
          )}
          title="Filter öffnen"
        >
          <Filter
            className="w-5 h-5 sm:w-5 sm:h-5 text-gray-500 group-hover/btn:text-gray-900 transition-colors duration-200"
            strokeWidth={1.5}
          />
        </button>
      </div>

      {/* Active Filters - Below Search Field, Mobile-Optimized */}
      {(activeFilters.length > 0 || activeCommand) && (
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 flex-wrap animate-fade-in">
          {/* Active Command Chip - Black with White X */}
          {activeCommand && (
            <div className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3',
              'bg-gray-900 text-white rounded-lg',
              'text-xs sm:text-sm font-medium tracking-tight'
            )}
            style={{
              fontFamily: '"DM Sans", sans-serif',
            }}>
              <span
                className="select-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
              >
                {COMMANDS.find((c) => c.value === activeCommand)?.label}
              </span>
              {onClearCommand && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClearCommand();
                  }}
                  className={cn(
                    'flex items-center justify-center',
                    'w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0',
                    'hover:bg-white/20 active:bg-white/30',
                    'rounded transition-colors duration-150'
                  )}
                  style={{ cursor: 'pointer' }}
                  aria-label="Befehl entfernen"
                >
                  <X size={10} className="sm:hidden text-white" strokeWidth={2.5} />
                  <X size={12} className="hidden sm:block text-white" strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}

          {/* Filter Chips - Standard Style, Mobile-Optimized */}
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3',
                'bg-gray-100 rounded-lg',
                'text-xs sm:text-sm font-medium text-gray-700',
                'border border-gray-200'
              )}
              style={{
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              <span
                className="select-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
              >
                {filter.label}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  filter.onRemove();
                }}
                className={cn(
                  'flex items-center justify-center',
                  'w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0',
                  'hover:bg-gray-300 active:bg-gray-400',
                  'rounded transition-colors duration-150'
                )}
                style={{ cursor: 'pointer' }}
                aria-label="Filter entfernen"
              >
                <X size={10} className="sm:hidden text-gray-600" strokeWidth={2.5} />
                <X size={12} className="hidden sm:block text-gray-600" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Command Suggestions - Elevated Dropdown, Mobile-Optimized */}
      {showCommands && filteredCommands.length > 0 && (
        <div
          ref={commandsRef}
          className={cn(
            'absolute top-full left-0 right-0 mt-4 sm:mt-6',
            'bg-white rounded-xl overflow-hidden',
            'animate-slide-up',
            'z-50'
          )}
          style={{
            boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.05), 0 20px 60px -20px rgba(0, 0, 0, 0.25)',
          }}
        >
          {filteredCommands.map((command, index) => (
            <button
              key={command.value}
              onClick={() => handleCommandClick(command)}
              className={cn(
                'w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4',
                'transition-all duration-150 ease-out',
                'text-left group/item',
                index !== filteredCommands.length - 1 && 'border-b border-gray-100',
                selectedIndex === index
                  ? 'bg-gray-900 text-white'
                  : 'hover:bg-gray-50 text-gray-900'
              )}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all duration-200',
                  selectedIndex === index
                    ? 'bg-white/10 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover/item:bg-gray-200'
                )}
              >
                {command.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-base sm:text-lg font-medium tracking-tight leading-tight"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  {command.label}
                </div>
                <div
                  className={cn(
                    'text-xs sm:text-sm mt-0.5 transition-colors duration-200',
                    selectedIndex === index ? 'text-gray-300' : 'text-gray-500'
                  )}
                >
                  {command.description}
                </div>
              </div>

              {/* Keyboard Hint - Hidden on Mobile */}
              {selectedIndex === index && (
                <div
                  className="hidden sm:flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-xs font-medium text-white/70"
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  ↵
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }

        /* Remove all focus styles from input */
        input[type="text"]:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          ring: 0 !important;
        }

        input[type="text"]:focus-visible {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
