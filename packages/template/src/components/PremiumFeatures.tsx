'use client';
import { ReactElement, cloneElement, useContext } from 'react';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { SubscriptionContext } from '@sudoku-web/types/subscriptionContext';
import { Star, CheckCircle, Lock } from 'react-feather';

interface PremiumFeature {
  icon: ReactElement;
  title: string;
  description?: string;
}

interface PremiumFeaturesProps {
  features: PremiumFeature[];
  title: string;
  subtitle: string;
  className?: string;
  compact?: boolean;
}

export function PremiumFeatures({
  features,
  title,
  subtitle,
  className = '',
  compact = false,
}: PremiumFeaturesProps) {
  const { isSubscribed, subscribeModal } = useContext(RevenueCatContext) || {};

  const premiumFeatures = features.map((feature) => ({
    ...feature,
    isPremium: !isSubscribed,
  }));

  const handlePremiumFeatureClick = (context?: SubscriptionContext) => {
    if (!isSubscribed) {
      subscribeModal?.showModalIfRequired(
        () => {},
        () => {},
        context
      );
    }
  };

  if (compact) {
    return (
      <div className={`${className}`}>
        {title && (
          <div className="mb-4 text-center">
            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          {premiumFeatures.slice(0, 3).map((feature, index) => (
            <div
              key={index}
              className={`flex items-center rounded-xl border bg-white/50 p-3 backdrop-blur-sm transition-all hover:bg-white/70 dark:bg-gray-800/50 dark:hover:bg-gray-800/70 ${
                feature.isPremium
                  ? 'cursor-pointer border-yellow-200 hover:border-yellow-300 dark:border-yellow-600'
                  : 'border-green-200 dark:border-green-600'
              }`}
              onClick={() => {
                if (feature.isPremium) {
                  handlePremiumFeatureClick();
                }
              }}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  feature.isPremium
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                }`}
              >
                {cloneElement(feature.icon, { className: 'h-4 w-4' })}
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
              <div className="ml-2">
                {feature.isPremium ? (
                  <Lock className="h-4 w-4 text-gray-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          ))}
          {premiumFeatures.length > 3 && (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              +{premiumFeatures.length - 3} more premium features
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`container mx-auto max-w-6xl px-6 py-6 md:py-8 ${className}`}
    >
      <div className="mb-6 md:mb-8">
        <h2 className="mb-2 text-center text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
          {title}
        </h2>
        <p className="text-center text-sm text-gray-600 md:text-base dark:text-gray-400">
          {subtitle}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {premiumFeatures.map((feature, index) => (
          <div
            key={index}
            className={`group relative rounded-2xl border-2 bg-white/80 p-4 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl md:p-6 dark:bg-gray-800/80 ${
              feature.isPremium
                ? 'cursor-pointer border-yellow-200 hover:border-yellow-300 dark:border-yellow-600'
                : 'border-green-200 dark:border-green-600'
            }`}
            onClick={() => {
              if (feature.isPremium) {
                handlePremiumFeatureClick();
              }
            }}
          >
            {feature.isPremium && (
              <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                <Star className="h-3 w-3" />
              </div>
            )}

            <div className="mb-3 flex items-center md:mb-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl md:h-12 md:w-12 ${
                  feature.isPremium
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                }`}
              >
                {cloneElement(feature.icon, {
                  className: 'h-5 w-5 md:h-6 md:w-6',
                })}
              </div>
              <div className="ml-3 flex-1 md:ml-4">
                {feature.isPremium ? (
                  <Lock className="float-right h-4 w-4 text-gray-400" />
                ) : (
                  <CheckCircle className="float-right h-4 w-4 text-green-500" />
                )}
              </div>
            </div>

            <h3 className="mb-2 text-base font-semibold text-gray-900 md:text-lg dark:text-white">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-600 md:text-sm dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
