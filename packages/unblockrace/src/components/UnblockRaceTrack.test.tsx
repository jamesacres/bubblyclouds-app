import React from 'react';
import { render, screen } from '@testing-library/react';
import { AgentProgress } from '@bubblyclouds-app/types/agentTypes';
import * as usePartiesModule from '@bubblyclouds-app/template/hooks/useParties';
import UnblockRaceTrack from './UnblockRaceTrack';
import { ServerState } from '../types/state';
import { solvedBoardString } from '../helpers/boardToString';
import { PlayerRunResult } from '../helpers/runResults';

jest.mock('@bubblyclouds-app/template/hooks/useParties');
// RateAppButton only renders on Capacitor or mobile web; force mobile-web so
// the rate-app prompt is exercised.
jest.mock('@bubblyclouds-app/template/helpers/capacitor', () => ({
  isCapacitor: () => false,
  isIOS: () => false,
  isAndroid: () => false,
}));
jest.mock('next/link', () => {
  const DummyLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  return { __esModule: true, default: DummyLink };
});

const mockUseParties = usePartiesModule.useParties as jest.Mock;

const setUserAgent = (value: string) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    value,
    writable: true,
  });
};

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const IOS_UA =
  'Mozilla/5.0 (iPad; CPU OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15';

const STAGE_1 = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');
const SOLVED_STAGE_1 = solvedBoardString(STAGE_1);

const inProgressState: ServerState = {
  initial: STAGE_1,
  final: SOLVED_STAGE_1,
  answerStack: [STAGE_1],
};

const completedState: ServerState = {
  initial: STAGE_1,
  final: SOLVED_STAGE_1,
  answerStack: [SOLVED_STAGE_1],
  completed: { at: '2026-07-11T00:00:00.000Z', seconds: 10 },
};

const agent = (
  overrides: Partial<AgentProgress<ServerState>>
): AgentProgress<ServerState> => ({
  agentId: 'agent-0',
  name: 'Bumblebee',
  emoji: '🐝',
  percentage: 40,
  skillLevel: 'novice',
  ...overrides,
});

const defaultProps = {
  sessionParties: {},
  state: inProgressState,
  userId: 'me',
  refreshSessionParties: jest.fn(),
  isPolling: false,
};

describe('UnblockRaceTrack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUserAgent(DESKTOP_UA);
    mockUseParties.mockReturnValue({
      getNicknameByUserId: () => 'Pal',
      parties: [],
      refreshParties: jest.fn(),
    });
  });

  it('drives an emoji kart and a legend chip for each agent', () => {
    render(
      <UnblockRaceTrack
        {...defaultProps}
        localAgentProgress={[agent({ percentage: 40 })]}
      />
    );

    expect(screen.getByTestId('agent-kart-agent-0')).toHaveTextContent('🐝');
    const legend = screen.getByTestId('agent-legend-agent-0');
    expect(legend).toHaveTextContent('Bumblebee');
    expect(legend).toHaveTextContent('40%');
    // Racing bots means the lane is no longer empty
    expect(
      screen.queryByText('Invite friends to race')
    ).not.toBeInTheDocument();
  });

  it('shows the finish time on a finished agent chip', () => {
    render(
      <UnblockRaceTrack
        {...defaultProps}
        localAgentProgress={[agent({ percentage: 100, finishTime: 65 })]}
      />
    );

    expect(screen.getByTestId('agent-legend-agent-0')).toHaveTextContent(
      '1:05'
    );
  });

  it('merges finished agents into the single-stage finished list by time', () => {
    render(
      <UnblockRaceTrack
        {...defaultProps}
        state={completedState}
        localAgentProgress={[
          agent({ percentage: 100, finishTime: 5, state: completedState }),
        ]}
      />
    );

    // The 5s agent beat the player's 10s finish
    expect(screen.getByText('1.').parentElement).toHaveTextContent('Bumblebee');
    expect(screen.getByText('2.').parentElement).toHaveTextContent('You');
  });

  it('renders agent rows on the run leaderboard with their emoji and name', () => {
    const stageResult = { seconds: 8, movesMade: 3, movesRequired: 3 };
    const runResults: PlayerRunResult[] = [
      {
        userId: 'agent-Sage',
        isCurrentUser: false,
        stageResults: [stageResult],
        totalSeconds: 8,
        totalMoves: 3,
        totalMovesDelta: 0,
        completedStageCount: 1,
        nickname: 'Sage',
        isAgent: true,
        emoji: '🦉',
      },
      {
        userId: 'me',
        isCurrentUser: true,
        stageResults: [{ seconds: 10, movesMade: 4, movesRequired: 3 }],
        totalSeconds: 10,
        totalMoves: 4,
        totalMovesDelta: 1,
        completedStageCount: 1,
      },
      {
        userId: 'friend',
        isCurrentUser: false,
        stageResults: [{ seconds: 12, movesMade: 3, movesRequired: 3 }],
        totalSeconds: 12,
        totalMoves: 3,
        totalMovesDelta: 0,
        completedStageCount: 1,
      },
    ];

    render(<UnblockRaceTrack {...defaultProps} runResults={runResults} />);

    const agentRow = screen.getByTestId('run-leaderboard-row-0');
    expect(agentRow).toHaveTextContent('Sage');
    expect(agentRow).toHaveTextContent('🦉');
    expect(screen.getByTestId('run-leaderboard-row-1')).toHaveTextContent(
      'You'
    );
    // Humans still resolve through the party nickname lookup
    expect(screen.getByTestId('run-leaderboard-row-2')).toHaveTextContent(
      'Pal'
    );
  });

  it('renders the rate-app prompt on the completed block when rateApp is passed', () => {
    setUserAgent(IOS_UA);
    render(
      <UnblockRaceTrack
        {...defaultProps}
        state={completedState}
        rateApp={{
          appName: 'Unblock Race',
          appStoreUrl: 'https://apps.apple.com/app/unblock-race/idTODO',
          googlePlayUrl:
            'https://play.google.com/store/apps/details?id=com.bubblyclouds.unblockrace',
        }}
      />
    );

    expect(screen.getByText(/Enjoying Unblock Race\?/i)).toBeInTheDocument();
  });

  it('omits the rate-app prompt when rateApp is not passed', () => {
    render(<UnblockRaceTrack {...defaultProps} state={completedState} />);
    expect(screen.queryByText(/Enjoying/i)).not.toBeInTheDocument();
  });
});
