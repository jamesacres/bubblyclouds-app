import { render, screen } from '@testing-library/react';
import { genericMemo } from './genericMemo';

function Greeting<Name extends string>({ name }: { name: Name }) {
  return <div>Hello, {name}</div>;
}

describe('genericMemo', () => {
  it('renders the wrapped component and preserves its generic call signature', () => {
    const MemoisedGreeting = genericMemo(Greeting);
    render(<MemoisedGreeting name="World" />);
    expect(screen.getByText('Hello, World')).toBeInTheDocument();
  });
});
