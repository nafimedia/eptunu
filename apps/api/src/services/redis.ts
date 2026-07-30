import Redis from 'ioredis';
import { env } from '../config/env';

// Disable automatic connection retries when Redis is not installed locally
export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy: () => null, // Stop reconnecting immediately if offline
});

// Suppress unhandled ECONNREFUSED console outputs in development
redis.on('error', () => {
  // Silent fallback for environments without Redis service installed
});
