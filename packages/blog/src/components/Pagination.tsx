import Link from 'next/link';
import { PaginationProps } from '../types/componentProps';

const Pagination = ({ totalPages, currentPage, basePath }: PaginationProps) => {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const getPreviousLink = () => {
    if (currentPage === 2) {
      return basePath;
    }
    return `${basePath}/page/${currentPage - 1}`;
  };

  return (
    <div className="space-y-2 pb-8 pt-6 md:space-y-5">
      <nav className="flex justify-between">
        {hasPrevious ? (
          <Link href={getPreviousLink()}>&larr; Previous</Link>
        ) : (
          <button className="cursor-auto disabled:opacity-50" disabled={true}>
            Previous
          </button>
        )}
        <span>
          {currentPage} of {totalPages}
        </span>
        {hasNext ? (
          <Link href={`${basePath}/page/${currentPage + 1}`}>Next &rarr;</Link>
        ) : (
          <button className="cursor-auto disabled:opacity-50" disabled={true}>
            Next
          </button>
        )}
      </nav>
    </div>
  );
};

export default Pagination;
