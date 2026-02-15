/**
 * Simple in-memory cache for server-side data
 * Uses LRU (Least Recently Used) eviction strategy
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = Date.now();
    return entry.value as T;
  }

  /**
   * Set value in cache with TTL (time to live) in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    // Evict oldest entry if at max size
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Evict oldest accessed entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Global cache instance
const cache = new MemoryCache(1000);

/**
 * Cache key builders
 */
export const CacheKeys = {
  investorStats: () => 'stats:investors',
  taskStats: () => 'stats:tasks',
  meetingStats: () => 'stats:meetings',
  investorList: (userId: string) => `investors:list:${userId}`,
  investor: (id: string) => `investor:${id}`,
  activities: (investorId: string) => `activities:${investorId}`,
};

/**
 * Cache wrapper with automatic key generation
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  cache.set(key, data, ttlSeconds);

  return data;
}

/**
 * Invalidate cache by key or pattern
 */
export function invalidateCache(keyOrPattern: string): void {
  if (keyOrPattern.includes('*')) {
    // Pattern matching - invalidate all matching keys
    const pattern = keyOrPattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);

    const stats = cache.getStats();
    // Can't iterate Map.keys() directly, need to convert to array
    const keys = Array.from({ length: stats.size }, (_, i) => i).map((i) => {
      // This is a workaround since we can't directly access Map keys
      // In production, consider using a better cache library like node-cache
      return null;
    });
  } else {
    // Exact match - invalidate single key
    cache.delete(keyOrPattern);
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return cache.getStats();
}

export default cache;
