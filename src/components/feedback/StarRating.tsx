import { Star, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 'md',
  disabled = false,
}: StarRatingProps) {
  const { t } = useTranslation();
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const starSize = size === 'sm' ? 20 : size === 'md' ? 28 : 36;

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleStarClick = (starValue: number) => {
    if (disabled) return;
    onChange(starValue);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange(null);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Star buttons */}
      <div
        className="flex gap-1"
        onMouseLeave={() => setHoverValue(null)}
      >
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={starValue}
            type="button"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => !disabled && setHoverValue(starValue)}
            onFocus={() => !disabled && setHoverValue(starValue)}
            onBlur={() => setHoverValue(null)}
            disabled={disabled}
            className={`
              ${sizeClasses[size]}
              flex items-center justify-center
              rounded-md
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${
              disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:scale-110 active:scale-95'
            }
            `}
            aria-label={`${starValue} ${starValue === 1 ? 'Stern' : 'Sterne'}`}
          >
            <Star
              size={starSize}
              className={`
                transition-all duration-200
                ${
                displayValue !== null && starValue <= displayValue
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              }
                ${!disabled && 'hover:text-yellow-400'}
              `}
            />
          </button>
        ))}
      </div>

      {/* Clear button */}
      {value !== null && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="
            ml-2 p-1.5 rounded-full
            text-gray-400 hover:text-gray-600 hover:bg-gray-100
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          "
          aria-label={t('feedback.ratings.clearRating')}
          title={t('feedback.ratings.clearRating')}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
