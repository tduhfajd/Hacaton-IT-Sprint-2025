import { Router } from 'express';
import { pool } from '@/config/database';
import { getRedisClient } from '@/config/redis';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbClient = await pool.connect();
    await dbClient.query('SELECT 1');
    dbClient.release();

    // Check Redis connection
    const redis = getRedisClient();
    await redis.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;