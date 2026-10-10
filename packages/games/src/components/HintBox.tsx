'use client';

import { ReactNode, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HintBox = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation('games');
  const [showHint, setShowHint] = useState(true);
  return (
    <>
      {showHint ? (
        <div className="mb-10 text-center text-sm">
          <div className="relative inline-block rounded-sm bg-amber-100 p-4 pr-8 text-black">
            <button
              onClick={() => setShowHint(false)}
              aria-label={t('hintBox.dismiss')}
            >
              <X className="absolute right-2 top-2" />
            </button>
            {children}
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export { HintBox };
export default HintBox;
