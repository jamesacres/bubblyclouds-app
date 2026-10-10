import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AgentDisplay } from '@bubblyclouds-app/template/components/lobby/AgentSelectSheet';
import { AgentIdentity } from '../types/Agent';

export const useAgentDisplay = (namespace: string) => {
  const { t } = useTranslation(namespace);
  return useCallback(
    (agent: AgentIdentity & { emojiName: string }): AgentDisplay => ({
      name: t(`agents.${agent.id}.name`, { defaultValue: agent.name }),
      personality: t(`agents.${agent.id}.personality`, { defaultValue: '' }),
      emojiName: t(`agents.${agent.id}.emojiName`, {
        defaultValue: agent.emojiName,
      }),
    }),
    [t]
  );
};
