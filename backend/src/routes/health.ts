import { Router } from 'express';
import { pool } from '../config/database';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // Check database connection
    const dbClient = await pool.connect();
    await dbClient.query('SELECT 1');
    dbClient.release();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'connected',
        api: 'running'
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