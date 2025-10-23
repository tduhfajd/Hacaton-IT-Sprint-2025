const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'smart_support',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin123'
});

const migration = `
ALTER TABLE appeal_analysis 
ADD COLUMN IF NOT EXISTS category_suggestion VARCHAR(100),
ADD COLUMN IF NOT EXISTS priority_suggestion VARCHAR(20),
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS summary TEXT;

CREATE TABLE IF NOT EXISTS ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appeal_id UUID NOT NULL REFERENCES appeals(id) ON DELETE CASCADE,
  suggested_text TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  sources TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ai_responses_appeal_id ON ai_responses(appeal_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_created_at ON ai_responses(created_at DESC);
`;

async function runMigration() {
  try {
    await pool.query(migration);
    console.log('✅ AI tables migration applied successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();

