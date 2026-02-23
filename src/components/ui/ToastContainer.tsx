import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Toast } from './Toast';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 pointer-events-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex transition-all duration-300 ease-out pointer-events-auto ${
          isHovered ? 'flex-row gap-3' : 'flex-col-reverse gap-0'
        }`}
      >
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={removeToast}
            index={isHovered ? index : toasts.length - 1 - index}
            isHovered={isHovered}
          />
        ))}
      </div>
    </div>
  );
}
