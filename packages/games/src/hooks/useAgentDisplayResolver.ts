import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AgentDisplayResolver } from '../types/Agent';

export const useAgentDisplayResolver = (
  namespace: string
): AgentDisplayResolver => {
  const { t } = useTranslation(namespace);
  return useCallback(
    (agent) => t(`agents.${agent.id}.name`, { defaultValue: agent.name }),
    [t]
  );
};
