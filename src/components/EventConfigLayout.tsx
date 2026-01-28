import { useState, useEffect } from 'react';
import { RaceEvent } from '../types';
import EventConfig from './EventConfig';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from './ui';
import { cn } from '../lib/designSystem';

interface EventConfigLayoutProps {
  onSubmit: (event: RaceEvent, startDate: string) => void;
  onBack: () => void;
  onImport: () => void;
  initialData?: RaceEvent;
  initialStartDate?: string;
  showImportButton?: boolean;
}

export default function EventConfigLayout({
  onSubmit,
  onBack,
  onImport,
  initialData,
  initialStartDate,
  showImportButton = true,
}: EventConfigLayoutProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-72px)]">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-2xl">
        {/* Top bar */}
        <div
          className={cn(
            'flex items-center justify-between mb-6 transition-all duration-400',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-2'
          )}
        >
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft size={18} />
            Zurück
          </Button>

          {showImportButton && (
            <Button
              onClick={onImport}
              variant="secondary"
              size="sm"
            >
              <Upload size={16} />
              <span className="hidden sm:inline">Importieren</span>
            </Button>
          )}
        </div>

        {/* Card */}
        <div
          className={cn(
            'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-400',
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3'
          )}
          style={{ transitionDelay: '80ms' }}
        >
          <div className="p-5 sm:p-8">
            <EventConfig
              onSubmit={onSubmit}
              initialData={initialData}
              initialStartDate={initialStartDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
