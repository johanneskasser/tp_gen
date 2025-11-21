import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { Toast as ToastType } from '../../contexts/ToastContext';
import { cn, typography } from '../../lib/designSystem';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
  index: number;
  isHovered: boolean;
}

const variantConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-success-bg',
    border: 'border-success-text',
    text: 'text-success-text',
    iconColor: 'text-success-text',
    progressBg: 'bg-success-text',
  },
  error: {
    icon: XCircle,
    bg: 'bg-error-bg',
    border: 'border-error-text',
    text: 'text-error-text',
    iconColor: 'text-error-text',
    progressBg: 'bg-error-text',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-yellow-50',
    border: 'border-yellow-600',
    text: 'text-yellow-800',
    iconColor: 'text-yellow-600',
    progressBg: 'bg-yellow-600',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-600',
    text: 'text-blue-800',
    iconColor: 'text-blue-600',
    progressBg: 'bg-blue-600',
  },
};

export function Toast({ toast, onClose, index, isHovered }: ToastProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  // Entry animation - use requestAnimationFrame to ensure initial state is rendered
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsEntering(false);
      });
    });
  }, []);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0 || isPaused) return;

    const startTime = Date.now();
    const interval = 50;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        handleClose();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration, isPaused]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getTransform = () => {
    if (isEntering) {
      return 'translateX(calc(100% + 100px))';
    }
    if (isExiting) {
      return 'translateX(calc(100% + 100px))';
    }
    if (isHovered) {
      return `translateX(-${index * 340}px) translateY(0) scale(1)`;
    }
    if (index > 0) {
      return 'translateX(0) translateY(8px) scale(0.95)';
    }
    return 'translateX(0) translateY(0) scale(1)';
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-l-4 shadow-lg transition-all duration-300 ease-out',
        'min-w-[320px] max-w-[420px]',
        config.bg,
        config.border
      )}
      style={{
        transform: getTransform(),
        opacity: isEntering || isExiting ? 0 : index > 0 && !isHovered ? 0.8 : 1,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Content */}
      <div className="flex items-start gap-3 p-4 pr-10">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <p className={cn(typography.body, 'flex-1', config.text)}>
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className={cn(
          'absolute top-3 right-3 p-1 rounded-md transition-colors',
          'hover:bg-black/10',
          config.text
        )}
        aria-label="Schließen"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <div
            className={cn('h-full transition-all duration-50 ease-linear', config.progressBg)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
