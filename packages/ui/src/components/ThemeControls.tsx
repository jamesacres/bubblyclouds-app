'use client';

import ThemeSwitch from './ThemeSwitch';
import ThemeColorSwitch from './ThemeColorSwitch';

interface ThemeControlsProps {
  isCapacitor?: () => boolean;
  isSubscribed: boolean;
  onPremiumColorClick: (colorName: string, onSuccess: () => void) => void;
  showRainbowAnimation?: boolean;
}

const ThemeControls = ({
  isCapacitor,
  isSubscribed,
  onPremiumColorClick,
  showRainbowAnimation,
}: ThemeControlsProps) => {
  return (
    <div className="relative flex items-center">
      <ThemeSwitch isCapacitor={isCapacitor} />
      <ThemeColorSwitch
        isSubscribed={isSubscribed}
        onPremiumColorClick={onPremiumColorClick}
        showRainbowAnimation={showRainbowAnimation}
      />
    </div>
  );
};

export default ThemeControls;
