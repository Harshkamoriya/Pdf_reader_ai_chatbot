// Redis connection setup
// import { createClient } from 'redis';
// export const redis = createClient();

import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Create a singleton instance with robust error handling
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 0, // Fail immediately if not connected
  enableOfflineQueue: false, // Don't queue commands if not connected
  lazyConnect: true,
  retryStrategy(times) {
    // Only retry for 5 seconds total then stop
    if (times > 10) return null;
    const delay = Math.min(times * 100, 1000);
    return delay;
  },
});

redis.on("error", (err) => {
  // Catch errors to prevent process crash
  console.error("[ioredis] Connection Error:", err.message);
});

// Helper to provide a connection object for BullMQ that won't crash
export const getSafeRedisConnection = () => ({
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
  username: redis.options.username,
  db: redis.options.db,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
