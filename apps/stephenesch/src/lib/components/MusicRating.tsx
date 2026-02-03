import Image from 'next/image';
import { StarsRating } from './StarsRating';

interface MusicRatingData {
  key: string;
  title: string;
  release_year: number;
  rating: number;
  rating_date: string;
  artist: string;
}

const MusicRating = ({
  data: { rating, key, title },
}: {
  data: MusicRatingData;
}) => {
  return (
    <div>
      <div className="flex">
        <p className="sr-only">Rated {rating / 2}</p>
        <StarsRating rating={rating} />
      </div>
      <Image
        alt={title}
        src={`/content/images/${key}.jpg`}
        width={360}
        height={360}
      />
    </div>
  );
};

export default MusicRating;
