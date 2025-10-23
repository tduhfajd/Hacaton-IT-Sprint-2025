import Redis from 'ioredis';

const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;
