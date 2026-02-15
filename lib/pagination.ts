/**
 * Pagination utilities for cursor-based pagination
 * Provides efficient pagination for large datasets
 */

export interface PaginationParams {
  limit?: number;
  cursor?: string;
  direction?: 'forward' | 'backward';
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Default pagination limit
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000;

/**
 * Encode cursor for pagination
 */
export function encodeCursor(value: string | number | Date): string {
  const str = typeof value === 'object' ? value.toISOString() : String(value);
  return Buffer.from(str).toString('base64');
}

/**
 * Decode cursor for pagination
 */
export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch {
    throw new Error('Invalid cursor');
  }
}

/**
 * Build pagination result
 */
export function buildPaginatedResult<T>(
  data: T[],
  limit: number,
  getCursorValue: (item: T) => string | number | Date
): PaginatedResult<T> {
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  return {
    data: items,
    nextCursor:
      hasMore && items.length > 0
        ? encodeCursor(getCursorValue(items[items.length - 1]))
        : null,
    prevCursor:
      items.length > 0 ? encodeCursor(getCursorValue(items[0])) : null,
    hasMore,
  };
}

/**
 * Parse and validate pagination params
 */
export function parsePaginationParams(
  params: URLSearchParams
): PaginationParams {
  const limit = Math.min(
    parseInt(params.get('limit') || String(DEFAULT_PAGE_SIZE)),
    MAX_PAGE_SIZE
  );

  const cursor = params.get('cursor') || undefined;
  const direction = (params.get('direction') as 'forward' | 'backward') || 'forward';

  return {
    limit,
    cursor,
    direction,
  };
}
