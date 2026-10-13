import { getI18n } from 'react-i18next';
import { renderHook } from '@testing-library/react';
import { useAgentDisplay } from './useAgentDisplay';

const NAMESPACE = 'agentDisplayFixture';

describe('useAgentDisplay', () => {
  beforeAll(() => {
    getI18n().addResourceBundle(
      'en',
      NAMESPACE,
      {
        agents: {
          bumblebee: {
            name: 'Abejorro',
            personality: 'Inquieto',
            emojiName: 'abeja',
          },
        },
      },
      true,
      true
    );
  });

  it('resolves name, personality and emoji name by agent id', () => {
    const { result } = renderHook(() => useAgentDisplay(NAMESPACE));

    expect(
      result.current({ id: 'bumblebee', name: 'Bumblebee', emojiName: 'bee' })
    ).toEqual({
      name: 'Abejorro',
      personality: 'Inquieto',
      emojiName: 'abeja',
    });
  });

  it('falls back to the identity fields when no translation exists', () => {
    const { result } = renderHook(() => useAgentDisplay(NAMESPACE));

    expect(
      result.current({ id: 'puddle', name: 'Puddle', emojiName: 'duck' })
    ).toEqual({ name: 'Puddle', personality: '', emojiName: 'duck' });
  });
});
