import { ReactElement } from 'react';

interface YearAgeAxisTickProps {
  x?: number;
  y?: number;
  payload?: { value: number };
  // Owner's birth year; the age shown is the tick's calendar year minus this.
  birthYear?: number;
  fontSize?: number;
}

// A two-line x-axis tick for the year-based charts: the calendar year on top and
// the owner's age at that year underneath. Falls back to the year alone when no
// birth year is supplied. Rendered as an SVG group so recharts can position it.
export const YearAgeAxisTick = ({
  x = 0,
  y = 0,
  payload,
  birthYear,
  fontSize = 11,
}: YearAgeAxisTickProps): ReactElement => {
  const year = payload?.value;
  const age =
    birthYear !== undefined && year !== undefined
      ? year - birthYear
      : undefined;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="middle"
        fill="currentColor"
        fontSize={fontSize}
      >
        {year}
      </text>
      {age !== undefined && (
        <text
          x={0}
          y={0}
          dy={22}
          textAnchor="middle"
          fill="currentColor"
          fillOpacity={0.55}
          fontSize={fontSize - 1}
        >
          {`age ${age}`}
        </text>
      )}
    </g>
  );
};
