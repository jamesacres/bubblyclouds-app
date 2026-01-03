'use client';

import ThemeSwitch from './ThemeSwitch';
import ThemeColorSwitch from './ThemeColorSwitch';

interface ThemeControlsProps {
  isCapacitor?: () => boolean;
}

const ThemeControls = ({ isCapacitor }: ThemeControlsProps) => {
  return (
    <div className="relative flex items-center">
      <ThemeSwitch isCapacitor={isCapacitor} />
      <ThemeColorSwitch />
    </div>
  );
};

export default ThemeControls;
