import Link from 'next/link';
import { PaginationProps } from '../types/componentProps';

const Pagination = ({ totalPages, currentPage, basePath }: PaginationProps) => {
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-2 pb-8 pt-6 md:space-y-5">
      <nav className="flex justify-between">
        {hasPrevious ? (
          <Link href={`${basePath}/page/${currentPage - 1}`}>
            &larr; Previous
          </Link>
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
