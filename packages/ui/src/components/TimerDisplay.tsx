import { formatSeconds } from '../helpers/formatSeconds';
import { Watch } from 'lucide-react';

const TimerDisplay = ({
  seconds,
  countdown,
  isComplete,
}: {
  seconds: number;
  countdown?: number;
  isComplete?: boolean;
}) => {
  let content;
  if (isComplete) {
    content = <span>👏 {formatSeconds(seconds)} 👏</span>;
  } else if (countdown) {
    content = <span>{countdown === 1 ? 'GO!' : countdown - 1}</span>;
  } else {
    content = (
      <>
        <Watch
          className="text-theme-primary dark:text-theme-primary-light m-auto inline"
          size={24}
        />{' '}
        {formatSeconds(seconds)}
      </>
    );
  }
  return <p className="min-h-8 font-mono">{content}</p>;
};
export { TimerDisplay };
