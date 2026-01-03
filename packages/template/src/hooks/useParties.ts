'use client';
import { useContext, useEffect } from 'react';
import { PartiesContext } from '../providers/PartiesProvider';

/**
 * Hook to access Parties context with automatic lazy loading
 *
 * @param refreshSessionParties - Optional callback to refresh session parties after loading
 * @returns Parties context value with party data, form state, and actions
 * @throws Error if used outside PartiesProvider
 */
export function useParties({
  refreshSessionParties,
}: {
  refreshSessionParties?: () => Promise<void>;
} = {}) {
  const context = useContext(PartiesContext);

  if (!context) {
    throw new Error('useParties must be used within a PartiesProvider');
  }

  const {
    parties,
    isLoading,
    showCreateParty,
    setShowCreateParty,
    isSaving,
    memberNickname,
    setMemberNickname,
    partyName,
    setPartyName,
    saveParty,
    updateParty,
    getNicknameByUserId,
    refreshParties: contextRefreshParties,
    lazyLoadParties,
    leaveParty,
    removeMember,
    deleteParty,
  } = context;

  // Trigger lazy loading when the hook is used
  useEffect(() => {
    lazyLoadParties();
  }, [lazyLoadParties]);

  // Wrap refreshParties to include the optional refreshSessionParties callback
  const refreshParties = async () => {
    return contextRefreshParties(refreshSessionParties);
  };

  return {
    // Party data
    parties,
    isLoading,

    // Form state
    showCreateParty,
    setShowCreateParty,
    isSaving,
    memberNickname,
    setMemberNickname,
    partyName,
    setPartyName,

    // Actions
    saveParty,
    updateParty,
    refreshParties,
    getNicknameByUserId,
    leaveParty,
    removeMember,
    deleteParty,
  };
}
