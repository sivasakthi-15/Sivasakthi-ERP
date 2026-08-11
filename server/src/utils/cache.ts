import { logger } from './logger';

export interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class CacheManager {
  private store = new Map<string, CacheEntry<any>>();

  /**
   * Put value in cache with optional TTL in seconds (default 300s / 5 mins)
   */
  public set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiry });
  }

  /**
   * Retrieve from cache. Discards automatically if expired.
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.store.delete(key); // Evict expired key
      return null;
    }

    return entry.value as T;
  }

  /**
   * Evict single key
   */
  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Delete keys matching a prefix (e.g. for automatic invalidation on updates)
   */
  public invalidatePrefix(prefix: string): void {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.info(`[CACHE INVALIDATION] Cleared ${count} keys starting with "${prefix}"`);
    }
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.store.clear();
    logger.info('[CACHE] Entire Cache cleared.');
  }

  /**
   * Size of cache
   */
  public size(): number {
    return this.store.size;
  }
}

export const cache = new CacheManager();
