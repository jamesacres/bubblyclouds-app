import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UnblockRace from './UnblockRace';
import { useGameState } from '../hooks/useGameState';
import { solvedBoardString } from '../helpers/boardToString';

jest.mock('../hooks/useGameState');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn(), push: jest.fn() })),
}));
jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  useSessions: jest.fn(() => ({ sessions: [] })),
}));
jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({}),
}));
jest.mock('@bubblyclouds-app/template/providers/RevenueCatProvider', () => ({
  RevenueCatContext: React.createContext({}),
}));
jest.mock('@bubblyclouds-app/ui/components/TimerDisplay', () => ({
  TimerDisplay: () => <div data-testid="timer-display">Timer</div>,
}));
jest.mock('@bubblyclouds-app/template/components/Lobby', () => {
  return function DummyLobby() {
    return <div data-testid="lobby">Lobby</div>;
  };
});
jest.mock('@bubblyclouds-app/games/components/LobbyButton', () => {
  const DummyLobbyButton = function DummyLobbyButton() {
    return <div data-testid="lobby-button">Button</div>;
  };
  return {
    __esModule: true,
    default: DummyLobbyButton,
  };
});
jest.mock('@bubblyclouds-app/ui/components/CelebrationAnimation', () => ({
  CelebrationAnimation: () => <div data-testid="celebration">Celebration</div>,
}));
jest.mock('@bubblyclouds-app/games/components/RaceTrack', () => {
  const DummyRaceTrack = function DummyRaceTrack() {
    return <div data-testid="race-track">Race Track</div>;
  };
  return {
    __esModule: true,
    default: DummyRaceTrack,
  };
});
jest.mock('@bubblyclouds-app/template/components/AppDownloadModal', () => ({
  AppDownloadModal: () => null,
}));
jest.mock('@bubblyclouds-app/template/helpers/capacitor', () => ({
  isCapacitor: jest.fn(() => true),
}));

const STAGE_1 = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');
const STAGE_2 = [
  'oooooo',
  'oooooo',
  'oAAoBo',
  'ooooBo',
  'oooooo',
  'oooooo',
].join('');

const mockUseGameState = useGameState as jest.MockedFunction<
  typeof useGameState
>;

const baseGameState = {
  answerStack: [STAGE_1],
  pushMove: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  isUndoDisabled: true,
  isRedoDisabled: true,
  timer: null,
  reset: jest.fn(),
  completed: undefined,
  setPauseTimer: jest.fn(),
  setTimerNewSession: jest.fn(),
  refreshSessionParties: jest.fn(),
  isPolling: false,
  sessionParties: {},
  showLobby: false,
  setShowLobby: jest.fn(),
  isPaused: false,
  registerInteraction: jest.fn(),
} as unknown as ReturnType<typeof useGameState>;

const defaultProps = {
  run: {
    stages: [
      { boardString: STAGE_1, movesRequired: 3 },
      { boardString: STAGE_2, movesRequired: 5 },
    ],
    runId: 'test-run',
  },
  metadata: {},
  showRacingPrompt: false,
  app: 'unblockrace',
  appName: 'Unblock Race',
  apiUrl: 'https://api.test.com',
  appUrl: 'https://unblockrace.test.com',
  appStoreUrl: 'https://apps.apple.com/test',
  googlePlayUrl: 'https://play.google.com/test',
  deepLinkScheme: 'com.test.unblockrace',
  mobileDescription: 'mobile',
  desktopDescription: 'desktop',
  openInAppLabel: 'Open',
};

describe('UnblockRace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    mockUseGameState.mockReturnValue({
      ...baseGameState,
      answer: STAGE_1,
    } as ReturnType<typeof useGameState>);
  });

  it('renders the board, race track and stage chip', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(screen.getByTestId('unblock-board')).toBeInTheDocument();
    expect(screen.getByTestId('race-track')).toBeInTheDocument();
    expect(screen.getByTestId('stage-chip')).toHaveTextContent('Stage 1/2');
  });

  it('shows a preview strip of upcoming stages', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(screen.getByTestId('stage-preview-0')).toBeInTheDocument();
    expect(screen.getByTestId('stage-preview-1')).toBeInTheDocument();
  });

  it('starts the first stage with its board string', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(mockUseGameState).toHaveBeenCalledWith(
      expect.objectContaining({
        initial: STAGE_1,
        final: solvedBoardString(STAGE_1),
        puzzleId: STAGE_1,
      })
    );
  });

  it('tags each stage session with the runId and stage index', () => {
    render(<UnblockRace {...defaultProps} />);
    expect(mockUseGameState).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          runId: 'test-run',
          stageIndex: '0',
          movesRequired: '3',
        }),
      })
    );
  });

  it('advances to the next stage without unmounting the racing chrome', () => {
    mockUseGameState.mockReturnValue({
      ...baseGameState,
      answer: solvedBoardString(STAGE_1),
      answerStack: [STAGE_1, solvedBoardString(STAGE_1)],
      completed: { at: new Date().toISOString(), seconds: 42 },
    } as ReturnType<typeof useGameState>);

    render(<UnblockRace {...defaultProps} />);
    const raceTrack = screen.getByTestId('race-track');

    fireEvent.click(screen.getByRole('button', { name: /next puzzle/i }));

    expect(screen.getByTestId('stage-chip')).toHaveTextContent('Stage 2/2');
    expect(mockUseGameState).toHaveBeenLastCalledWith(
      expect.objectContaining({
        initial: STAGE_2,
        puzzleId: STAGE_2,
        metadata: expect.objectContaining({ stageIndex: '1' }),
      })
    );
    // Same DOM node — the chrome stayed mounted across the stage swap
    expect(screen.getByTestId('race-track')).toBe(raceTrack);
  });

  it('resumes at the first incomplete stage after a refresh', () => {
    window.localStorage.setItem(
      `unblockrace-${STAGE_1}`,
      JSON.stringify({
        state: {
          initial: STAGE_1,
          answerStack: [solvedBoardString(STAGE_1)],
          completed: { at: new Date().toISOString(), seconds: 30 },
        },
      })
    );

    render(<UnblockRace {...defaultProps} />);
    expect(screen.getByTestId('stage-chip')).toHaveTextContent('Stage 2/2');
  });

  it('omits the stage chip for single-puzzle runs', () => {
    render(
      <UnblockRace
        {...defaultProps}
        run={{ stages: [{ boardString: STAGE_1, movesRequired: 3 }] }}
      />
    );
    expect(screen.queryByTestId('stage-chip')).not.toBeInTheDocument();
  });
});
