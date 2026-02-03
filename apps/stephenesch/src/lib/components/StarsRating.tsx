import { Star } from 'lucide-react';

const HalfStar = ({
  fill,
  stroke,
  fill2,
  stroke2,
  size,
}: {
  fill: string;
  stroke: string;
  fill2: string;
  stroke2: string;
  size: number;
}) => (
  <div className="flex">
    <div className="overflow-hidden" style={{ width: size / 2 }}>
      <Star fill={fill} stroke={stroke} size={size} />
    </div>
    <div className="relative overflow-hidden" style={{ width: size / 2 }}>
      <Star
        fill={fill2}
        stroke={stroke2}
        size={size}
        className="absolute right-0"
      />
    </div>
  </div>
);

export const StarsRating = ({ rating }: { rating: number }) => {
  const ratingOutFive = rating / 2;
  const left = Math.floor(ratingOutFive);
  const right = 5 - Math.ceil(ratingOutFive);
  const showHalf = left + right < 5;
  const size = 32;
  const color = '#0ea5e9';
  return (
    <div className="flex items-center justify-center">
      {Array.from(Array(left)).map((_, i) => (
        <Star key={i} fill={color} stroke={color} size={size} />
      ))}
      {showHalf ? (
        <HalfStar
          fill={color}
          stroke={color}
          fill2="white"
          stroke2="white"
          size={size}
        />
      ) : undefined}
      {Array.from(Array(right)).map((_, i) => (
        <Star key={i} fill="white" stroke="white" size={size} />
      ))}
    </div>
  );
};
