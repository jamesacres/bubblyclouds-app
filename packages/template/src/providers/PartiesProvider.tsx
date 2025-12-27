'use client';
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  createContext,
} from 'react';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import { useServerStorage } from '../hooks/serverStorage';
import { Party } from '@sudoku-web/types/serverTypes';

interface PartiesContextInterface {
  // Party data
  parties: Party[];
  isLoading: boolean;

  // Form state
  showCreateParty: boolean;
  setShowCreateParty: (show: boolean) => void;
  isSaving: boolean;
  memberNickname: string;
  setMemberNickname: (nickname: string) => void;
  partyName: string;
  setPartyName: (name: string) => void;

  // Actions
  saveParty: (params: {
    memberNickname: string;
    partyName: string;
  }) => Promise<Party | undefined>;
  updateParty: (
    partyId: string,
    updates: { maxSize?: number; partyName?: string }
  ) => Promise<boolean>;
  refreshParties: (
    refreshSessionParties?: () => Promise<void>
  ) => Promise<Party[] | undefined>;
  lazyLoadParties: () => Promise<void>;
  getNicknameByUserId: (userId: string) => string | null;
  leaveParty: (partyId: string) => Promise<boolean>;
  removeMember: (partyId: string, userId: string) => Promise<boolean>;
  deleteParty: (partyId: string) => Promise<boolean>;
}

export const PartiesContext = createContext<
  PartiesContextInterface | undefined
>(undefined);

const PartiesProvider: React.FC<{
  children: React.ReactNode;
  app: string;
  apiUrl: string;
}> = ({ children, app, apiUrl }) => {
  const context = useContext(UserContext) as UserContextInterface | undefined;
  const { user } = context || {};
  const {
    listParties,
    createParty,
    updateParty,
    leaveParty,
    removeMember,
    deleteParty,
  } = useServerStorage({ app, apiUrl });

  // Party state
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Load parties lazily - only when first accessed
  const [hasInitialized, setHasInitialized] = useState(false);

  // Form state
  const [showCreateParty, setShowCreateParty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [memberNickname, setMemberNickname] = useState(
    user?.given_name || user?.name || ''
  );
  const [partyName, setPartyName] = useState('');

  // Update member nickname when user changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMemberNickname(user?.given_name || user?.name || '');
    }, 0);
    return () => clearTimeout(timeout);
  }, [user]);

  // Reset initialization state when user changes to trigger reload
  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasInitialized(false);
      setParties([]);
    }, 0);
    return () => clearTimeout(timeout);
  }, [user]);

  // Create a new party
  const saveParty = useCallback(
    async (params: { memberNickname: string; partyName: string }) => {
      if (params.memberNickname && params.partyName) {
        setIsSaving(true);
        const party = await createParty(params);
        if (party) {
          setParties((prevParties) => [...prevParties, party]);
        }
        setMemberNickname('');
        setPartyName('');
        setShowCreateParty(false);
        setIsSaving(false);
        return party;
      }
    },
    [createParty]
  );

  // Refresh parties from server (also triggers initial load if needed)
  const refreshParties = useCallback(
    async (refreshSessionParties?: () => Promise<void>) => {
      if (!user) {
        console.warn('refreshParties not logged in');
        return;
      }
      if (!isLoading) {
        if (!hasInitialized) {
          setHasInitialized(true);
        }
        setIsLoading(true);
        const values = await listParties();
        if (values) {
          setParties(values);
        }
        if (refreshSessionParties) {
          await refreshSessionParties();
        }
        setIsLoading(false);
        return values;
      }
      return parties;
    },
    [listParties, isLoading, parties, hasInitialized, user]
  );

  // Get nickname for a specific user ID across all parties
  const getNicknameByUserId = useCallback(
    (userId: string): string | null => {
      for (const party of parties) {
        if (!party.members) continue;
        const member = party.members.find((member) => member.userId === userId);
        if (member) {
          return member.memberNickname;
        }
      }
      return null;
    },
    [parties]
  );

  // Leave a party (or delete if owner)
  const handleLeaveParty = useCallback(
    async (partyId: string): Promise<boolean> => {
      const success = await leaveParty(partyId);
      if (success) {
        setParties((prevParties) =>
          prevParties.filter((party) => party.partyId !== partyId)
        );
      }
      return success;
    },
    [leaveParty]
  );

  // Remove a member from a party
  const handleRemoveMember = useCallback(
    async (partyId: string, userId: string): Promise<boolean> => {
      const success = await removeMember(partyId, userId);
      if (success) {
        setParties((prevParties) =>
          prevParties.map((party) =>
            party.partyId === partyId
              ? {
                  ...party,
                  members: (party.members || []).filter(
                    (member) => member.userId !== userId
                  ),
                }
              : party
          )
        );
      }
      return success;
    },
    [removeMember]
  );

  // Update a party (owner only)
  const handleUpdateParty = useCallback(
    async (
      partyId: string,
      updates: { maxSize?: number; partyName?: string }
    ): Promise<boolean> => {
      const success = await updateParty(partyId, updates);
      if (success) {
        setParties((prevParties) =>
          prevParties.map((party) =>
            party.partyId === partyId ? { ...party, ...updates } : party
          )
        );
      }
      return success;
    },
    [updateParty]
  );

  // Delete a party (owner only)
  const handleDeleteParty = useCallback(
    async (partyId: string): Promise<boolean> => {
      const success = await deleteParty(partyId);
      if (success) {
        setParties((prevParties) =>
          prevParties.filter((party) => party.partyId !== partyId)
        );
      }
      return success;
    },
    [deleteParty]
  );

  const lazyLoadParties = useCallback(async () => {
    if (!hasInitialized && !isLoading && user) {
      console.info('loadParties (lazy)');
      setHasInitialized(true);
      setIsLoading(true);
      const values = await listParties();
      if (values) {
        setParties(values);
      }
      setIsLoading(false);
    }
  }, [hasInitialized, isLoading, listParties, user]);

  return (
    <PartiesContext.Provider
      value={{
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
        updateParty: handleUpdateParty,
        refreshParties,
        lazyLoadParties,
        getNicknameByUserId,
        leaveParty: handleLeaveParty,
        removeMember: handleRemoveMember,
        deleteParty: handleDeleteParty,
      }}
    >
      {children}
    </PartiesContext.Provider>
  );
};

export default PartiesProvider;
