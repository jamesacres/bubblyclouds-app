import React from 'react';
import { render, screen } from '@testing-library/react';
import { PartyTag } from './PartyTag';

describe('PartyTag', () => {
  it('renders the party name', () => {
    render(<PartyTag partyName="Team Alpha" />);
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
  });

  it('renders as an inline span', () => {
    const { container } = render(<PartyTag partyName="Family" />);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });

  it('renders an empty party name', () => {
    render(<PartyTag partyName="" />);
    const span = document.querySelector('span');
    expect(span).toBeInTheDocument();
  });

  it('renders a long party name without truncation', () => {
    const longName = 'A Very Long Team Name';
    render(<PartyTag partyName={longName} />);
    expect(screen.getByText(longName)).toBeInTheDocument();
  });
});
