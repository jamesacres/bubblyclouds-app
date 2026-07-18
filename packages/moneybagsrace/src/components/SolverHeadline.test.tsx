import { render, screen } from '@testing-library/react';
import { SolverResult } from '../types/simulation';
import SolverHeadline, { solverHeadlineAge } from './SolverHeadline';

const achieved: SolverResult = {
  earliestRetirementMonth: '2041-03',
  achievedSuccessRatePct: 91.2,
  agesAtRetirement: { 'user-2': 55, 'user-1': 52 },
};

describe('SolverHeadline', () => {
  it('renders the spec headline with the primary user age', () => {
    render(
      <SolverHeadline
        result={achieved}
        targetSuccessRatePct={90}
        primaryUserId="user-1"
      />
    );
    expect(screen.getByTestId('solver-headline')).toHaveTextContent(
      'You can retire in March 2041 (age 52) at 90% confidence'
    );
  });

  it('falls back to the first member age when the primary user is absent', () => {
    render(
      <SolverHeadline
        result={achieved}
        targetSuccessRatePct={90}
        primaryUserId="user-3"
      />
    );
    expect(screen.getByTestId('solver-headline')).toHaveTextContent('(age 55)');
  });

  it('omits the age when no ages are known', () => {
    render(
      <SolverHeadline
        result={{ ...achieved, agesAtRetirement: {} }}
        targetSuccessRatePct={90}
      />
    );
    expect(screen.getByTestId('solver-headline')).toHaveTextContent(
      'You can retire in March 2041 at 90% confidence'
    );
  });

  it('shows the unachievable state', () => {
    render(
      <SolverHeadline
        result={{ agesAtRetirement: {} }}
        targetSuccessRatePct={90}
      />
    );
    expect(
      screen.getByTestId('solver-headline-unachievable')
    ).toHaveTextContent(
      'Not yet achievable within 40 years — try the retirement planner'
    );
  });

  it('shows a progress bar while running', () => {
    render(
      <SolverHeadline isRunning progress={0.6} targetSuccessRatePct={90} />
    );
    expect(screen.getByTestId('solver-headline-loading')).toHaveTextContent(
      'Finding your earliest retirement date…'
    );
    expect(screen.getByTestId('solver-headline-progress')).toHaveStyle({
      width: '60%',
    });
    expect(screen.queryByTestId('solver-headline')).not.toBeInTheDocument();
  });

  it('renders nothing without a result when idle', () => {
    const { container } = render(<SolverHeadline targetSuccessRatePct={90} />);
    expect(container).toBeEmptyDOMElement();
  });

  describe('solverHeadlineAge', () => {
    it('prefers the primary user and falls back to the first entry', () => {
      expect(solverHeadlineAge(achieved, 'user-1')).toBe(52);
      expect(solverHeadlineAge(achieved, 'missing')).toBe(55);
      expect(solverHeadlineAge(achieved)).toBe(55);
      expect(
        solverHeadlineAge({ agesAtRetirement: {} }, 'user-1')
      ).toBeUndefined();
    });
  });
});
