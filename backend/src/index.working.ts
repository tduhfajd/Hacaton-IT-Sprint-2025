import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGINS']?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://user-smartsupport.vadimevgrafov.ru',
    'https://operator-smartsupport.vadimevgrafov.ru',
    'https://admin-smartsupport.vadimevgrafov.ru'
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Try to check database connection
    const { pool } = require('./config/database');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

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
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'disconnected',
        api: 'running'
      }
    });
  }
});

// Basic API endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    message: 'Smart Assistant API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    endpoints: {
      health: '/health',
      status: '/api/status',
      auth: '/api/auth/*',
      appeals: '/api/appeals/*',
      ai: '/api/ai/*',
      chat: '/api/chat/*',
      operators: '/api/operators/*',
      admin: '/api/admin/*',
      files: '/api/files/*'
    }
  });
});

// Placeholder routes - будем подключать постепенно
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'Test endpoint works!',
    host: _req.get('host'),
    timestamp: new Date().toISOString()
  });
});

// Auth placeholder
app.get('/api/auth/test', (_req, res) => {
  res.json({ message: 'Auth endpoint placeholder' });
});

// Appeals placeholder
app.get('/api/appeals/test', (_req, res) => {
  res.json({ message: 'Appeals endpoint placeholder' });
});

// AI placeholder
app.get('/api/ai/test', (_req, res) => {
  res.json({ message: 'AI endpoint placeholder' });
});

// Chat placeholder
app.get('/api/chat/test', (_req, res) => {
  res.json({ message: 'Chat endpoint placeholder' });
});

// Operators placeholder
app.get('/api/operators/test', (_req, res) => {
  res.json({ message: 'Operators endpoint placeholder' });
});

// Admin placeholder
app.get('/api/admin/test', (_req, res) => {
  res.json({ message: 'Admin endpoint placeholder' });
});

// Files placeholder
app.get('/api/files/test', (_req, res) => {
  res.json({ message: 'Files endpoint placeholder' });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env['NODE_ENV'] === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API status: http://localhost:${PORT}/api/status`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   - Health: http://localhost:${PORT}/health`);
  console.log(`   - Status: http://localhost:${PORT}/api/status`);
  console.log(`   - Auth: http://localhost:${PORT}/api/auth/test`);
  console.log(`   - Appeals: http://localhost:${PORT}/api/appeals/test`);
  console.log(`   - AI: http://localhost:${PORT}/api/ai/test`);
  console.log(`   - Chat: http://localhost:${PORT}/api/chat/test`);
  console.log(`   - Operators: http://localhost:${PORT}/api/operators/test`);
  console.log(`   - Admin: http://localhost:${PORT}/api/admin/test`);
  console.log(`   - Files: http://localhost:${PORT}/api/files/test`);
  console.log(`\n🌐 Environment: ${process.env['NODE_ENV'] || 'development'}`);
});

