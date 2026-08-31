'use client';

import { Loader } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AuthGateProps {
  // True while cold-start auth (token refresh/session resolution) is still
  // resolving - neither logged in nor out is known yet, so no login prompt
  // is shown.
  isInitialised: boolean;
  // Called once auth has resolved without a confirmed user, to open the
  // login modal. The header already exposes its own always-visible sign-in
  // entry point, so this is just the auto-launch trigger - there's no
  // in-gate button for the user to click.
  onSignInRequired: () => void;
}

// Full-page replacement for the puzzle-playing subtree (Lobby + board) while
// no confirmed user exists. Rendered in place of the whole subtree (not
// layered on top of it) so a signed-out visitor never mounts the board or
// creates any server game-state. Auto-launches the login modal on mount
// rather than showing its own CTA card, since the header's sign-in button
// is always available as a fallback if the modal is dismissed.
const AuthGate = ({ isInitialised, onSignInRequired }: AuthGateProps) => {
  const hasRequestedSignIn = useRef(false);

  useEffect(() => {
    if (!isInitialised) {
      // Auth hasn't resolved yet - reset so sign-in is requested once
      // resolution completes without a user.
      hasRequestedSignIn.current = false;
      return;
    }

    if (hasRequestedSignIn.current) return;
    hasRequestedSignIn.current = true;
    onSignInRequired();
  }, [isInitialised, onSignInRequired]);

  return (
    <div
      data-testid="auth-gate"
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/45 backdrop-blur-sm"
    >
      {!isInitialised && (
        <Loader
          data-testid="auth-gate-loading"
          className="animate-spin"
          size={32}
          color="white"
        />
      )}
    </div>
  );
};

export default AuthGate;
