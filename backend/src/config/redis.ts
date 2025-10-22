import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
    throw error;
  }
}