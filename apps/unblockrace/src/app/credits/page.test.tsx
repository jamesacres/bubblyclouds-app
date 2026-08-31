import React from 'react';
import { render, screen } from '@testing-library/react';
import CreditsPage from './page';

describe('CreditsPage', () => {
  it('renders the Credits component', () => {
    render(<CreditsPage />);
    expect(screen.getByText(/Credits & Attribution/i)).toBeInTheDocument();
  });
});
