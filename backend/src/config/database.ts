import { Pool, PoolConfig } from 'pg';
import { logger } from '@/utils/logger';

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'smart_assistant',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

export async function connectDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
}