import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PartyInviteButton } from './PartyInviteButton';
import * as serverStorageModule from '../hooks/serverStorage';

jest.mock('../hooks/serverStorage', () => ({
  __esModule: true,
  useServerStorage: jest.fn(),
}));

jest.mock('@bubblyclouds-app/ui/components/CopyButton', () => ({
  __esModule: true,
  CopyButton: ({
    getText,
    partyName,
    extraSmall,
    appName,
  }: {
    getText: () => Promise<string>;
    partyName: string;
    extraSmall?: boolean;
    appName: string;
  }) => {
    const [text, setText] = React.useState('');
    const handleClick = async () => {
      const result = await getText();
      setText(result);
    };
    return (
      <button
        data-testid="copy-button"
        data-party={partyName}
        data-extra-small={extraSmall}
        data-text={text}
        data-app-name={appName}
        onClick={handleClick}
      >
        Copy: {partyName}
      </button>
    );
  },
}));

const mockUseServerStorage = serverStorageModule.useServerStorage as jest.Mock;

describe('PartyInviteButton', () => {
  const defaultProps = {
    sessionId: 'sudoku-puzzle123',
    redirectUri: '/puzzle/123',
    partyId: 'party1',
    partyName: 'Test Party',
    app: 'mockApp',
    appName: 'Sudoku Race',
    apiUrl: 'https://api.mockApp.bubblyclouds.com',
    appUrl: 'https://mockApp.bubblyclouds.com',
  };

  let mockCreateInvite: jest.Mock;

  beforeEach(() => {
    mockCreateInvite = jest.fn().mockResolvedValue({ inviteId: 'invite123' });
    mockUseServerStorage.mockReturnValue({ createInvite: mockCreateInvite });
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create an invite and generate the URL', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PartyInviteButton {...defaultProps} />);

    const copyButton = screen.getByTestId('copy-button');
    await user.click(copyButton);

    await waitFor(() => {
      expect(mockCreateInvite).toHaveBeenCalledWith({
        sessionId: defaultProps.sessionId,
        redirectUri: defaultProps.redirectUri,
        expiresAt: new Date('2024-01-08').toISOString(),
        description: defaultProps.partyName,
        resourceId: `party-${defaultProps.partyId}`,
      });
    });

    await waitFor(() => {
      expect(copyButton).toHaveAttribute(
        'data-text',
        `${defaultProps.appUrl}/invite?inviteId=invite123`
      );
    });
  });

  it('should handle invite creation failure gracefully', async () => {
    const user = userEvent.setup({ delay: null });
    mockCreateInvite.mockResolvedValue(null);
    render(<PartyInviteButton {...defaultProps} />);

    const copyButton = screen.getByTestId('copy-button');
    await user.click(copyButton);

    await waitFor(() => {
      expect(mockCreateInvite).toHaveBeenCalled();
    });

    expect(copyButton).toHaveAttribute('data-text', '');
  });
});
