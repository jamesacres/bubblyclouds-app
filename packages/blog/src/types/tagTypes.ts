export interface TagCount {
  tag: string; // Normalized tag slug
  displayName: string; // Original tag name
  count: number; // Number of posts with this tag
}

export interface PaginatedResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
