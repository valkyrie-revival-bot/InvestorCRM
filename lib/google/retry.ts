/**
 * Exponential backoff retry wrapper for Google API calls
 * Implements retry logic for rate limiting (429) and service unavailable (503) errors
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

/**
 * Wraps Google API calls with exponential backoff retry logic
 *
 * Formula: min((2^attempt * baseDelay) + random(0-1000), maxDelay)
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Result of successful function call
 * @throws Original error if max retries exhausted or non-retryable error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 32000,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable (429 rate limit, 503 service unavailable)
      const isRetryable =
        error?.code === 429 ||
        error?.code === 503 ||
        error?.response?.status === 429 ||
        error?.response?.status === 503;

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = Math.pow(2, attempt) * baseDelay;
      const jitter = Math.random() * 1000;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      console.log(
        `Google API rate limit hit, retrying in ${Math.round(delay)}ms (attempt ${
          attempt + 1
        }/${maxRetries})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
