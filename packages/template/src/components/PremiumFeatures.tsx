'use client';
import { ComponentType, useContext } from 'react';
import { RevenueCatContext } from '../providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';
import { CheckCircle, Lock } from 'lucide-react';

interface PremiumFeature {
  icon: ComponentType<{ className?: string }>;
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
          <div className="mb-3">
            <h3 className="mb-0.5 text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          {premiumFeatures.slice(0, 3).map((feature, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors duration-200 ${
                feature.isPremium
                  ? 'cursor-pointer border-stone-200 bg-white hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800'
                  : 'border-stone-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
              }`}
              onClick={() => {
                if (feature.isPremium) {
                  handlePremiumFeatureClick();
                }
              }}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  feature.isPremium
                    ? 'bg-stone-100 text-stone-600 dark:bg-zinc-700 dark:text-zinc-300'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}
              >
                <feature.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {feature.title}
                </h4>
              </div>
              {feature.isPremium ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              )}
            </div>
          ))}
          {premiumFeatures.length > 3 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              +{premiumFeatures.length - 3} more features
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`container mx-auto max-w-4xl px-6 py-6 md:py-8 ${className}`}
    >
      <div className="mb-5 md:mb-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 md:text-xl dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 md:gap-3">
        {premiumFeatures.map((feature, index) => (
          <div
            key={index}
            className={`group relative flex items-start gap-3 rounded-xl border p-4 transition-all duration-200 md:p-5 ${
              feature.isPremium
                ? 'dark:hover:bg-zinc-750 cursor-pointer border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600'
                : 'border-stone-200 bg-white dark:border-zinc-700 dark:bg-zinc-800'
            }`}
            onClick={() => {
              if (feature.isPremium) {
                handlePremiumFeatureClick();
              }
            }}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                feature.isPremium
                  ? 'bg-stone-100 text-stone-600 dark:bg-zinc-700 dark:text-zinc-300'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}
            >
              <feature.icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                {feature.isPremium ? (
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                ) : (
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
