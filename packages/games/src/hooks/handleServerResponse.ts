import { useCallback } from 'react';
import {
  Parties,
  ServerStateResult,
  Session,
} from '@bubblyclouds-app/types/serverTypes';

function useHandleServerResponse<ServerState>(
  setSessionParties: (parties: Parties<Session<ServerState>>) => void
) {
  return useCallback(
    (
      active: boolean,
      serverValue: ServerStateResult<ServerState> | undefined
    ) => {
      if (
        active &&
        serverValue?.parties &&
        Object.keys(serverValue.parties).length
      ) {
        setSessionParties(serverValue.parties);
      }
    },
    [setSessionParties]
  );
}

export { useHandleServerResponse };
