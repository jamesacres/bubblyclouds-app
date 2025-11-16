'use client';

import { ReactNode, useState } from 'react';
import { X } from 'react-feather';

const HintBox = ({ children }: { children: ReactNode }) => {
  const [showHint, setShowHint] = useState(true);
  return (
    <>
      {showHint ? (
        <div className="mb-10 text-center text-sm">
          <div className="relative inline-block rounded-sm bg-amber-100 p-4 pr-8 text-black">
            <button onClick={() => setShowHint(false)}>
              <X className="absolute top-2 right-2" />
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
