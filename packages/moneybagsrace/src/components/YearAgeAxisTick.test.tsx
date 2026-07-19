import { render } from '@testing-library/react';
import { YearAgeAxisTick } from './YearAgeAxisTick';

const renderTick = (props: Parameters<typeof YearAgeAxisTick>[0]) =>
  render(
    <svg>
      <YearAgeAxisTick {...props} />
    </svg>
  );

describe('YearAgeAxisTick', () => {
  it('shows the year and the owner age at that year', () => {
    const { container } = renderTick({
      x: 0,
      y: 0,
      payload: { value: 2040 },
      birthYear: 1980,
    });
    expect(container.textContent).toContain('2040');
    expect(container.textContent).toContain('age 60');
  });

  it('shows only the year when no birth year is given', () => {
    const { container } = renderTick({
      x: 0,
      y: 0,
      payload: { value: 2040 },
    });
    expect(container.textContent).toContain('2040');
    expect(container.textContent).not.toContain('age');
  });
});
