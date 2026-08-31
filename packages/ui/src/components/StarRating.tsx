'use client';
import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  staggerMs?: number;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
};

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 3,
  size = 'md',
  animated = false,
  staggerMs = 220,
  className,
}) => {
  const sizeClass = SIZE_CLASSES[size];
  const filledCount = Math.max(0, Math.min(max, Math.round(rating)));

  return (
    <span
      role="img"
      aria-label={`${filledCount} of ${max} stars`}
      className={`inline-flex items-center gap-1 ${className ?? ''}`}
    >
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < filledCount;
        return (
          <span
            key={i}
            className={animated ? 'star-rating-pop' : undefined}
            style={
              animated ? { animationDelay: `${i * staggerMs}ms` } : undefined
            }
          >
            <Star
              className={`${sizeClass} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.7)]'
                  : 'fill-transparent text-gray-300 dark:text-gray-600'
              }`}
            />
          </span>
        );
      })}
      {animated && (
        <style>{`
          .star-rating-pop {
            display: inline-flex;
            transform: scale(0);
            animation: star-rating-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)
              forwards;
          }
          @keyframes star-rating-pop-in {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            60% {
              transform: scale(1.25);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .star-rating-pop {
              transform: none;
              opacity: 1;
              animation: none;
            }
          }
        `}</style>
      )}
    </span>
  );
};

export { StarRating };
export type { StarRatingProps };
