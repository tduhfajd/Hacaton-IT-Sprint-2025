import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface AppealAnalysis {
  id: string;
  appeal_id: string;
  sentiment_type: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  category_suggestion?: string;
  priority_suggestion?: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  summary: string;
  ai_confidence: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAnalysisData {
  appeal_id: string;
  sentiment_type: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  category_suggestion?: string;
  priority_suggestion?: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  summary: string;
  ai_confidence: number;
}

export interface UpdateAnalysisData {
  sentiment_type?: 'positive' | 'neutral' | 'negative';
  sentiment_score?: number;
  category_suggestion?: string;
  priority_suggestion?: 'low' | 'medium' | 'high' | 'critical';
  keywords?: string[];
  summary?: string;
  ai_confidence?: number;
}

export class AppealAnalysisModel {
  constructor(private db: Pool) {}

  async create(analysisData: CreateAnalysisData): Promise<AppealAnalysis> {
    const { 
      appeal_id, 
      sentiment_type, 
      sentiment_score, 
      category_suggestion, 
      priority_suggestion, 
      keywords, 
      summary, 
      ai_confidence 
    } = analysisData;
    
    const id = uuidv4();
    const query = `
      INSERT INTO appeal_analysis (
        id, appeal_id, sentiment_type, sentiment_score, 
        category_suggestion, priority_suggestion, keywords, 
        summary, ai_confidence
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      id, appeal_id, sentiment_type, sentiment_score, 
      category_suggestion, priority_suggestion, keywords, 
      summary, ai_confidence
    ];
    const result = await this.db.query(query, values);
    
    return result.rows[0];
  }

  async findByAppealId(appealId: string): Promise<AppealAnalysis | null> {
    const query = 'SELECT * FROM appeal_analysis WHERE appeal_id = $1';
    const result = await this.db.query(query, [appealId]);
    
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<AppealAnalysis | null> {
    const query = 'SELECT * FROM appeal_analysis WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async update(id: string, analysisData: UpdateAnalysisData): Promise<AppealAnalysis | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (analysisData.sentiment_type !== undefined) {
      fields.push(`sentiment_type = $${paramCount++}`);
      values.push(analysisData.sentiment_type);
    }
    
    if (analysisData.sentiment_score !== undefined) {
      fields.push(`sentiment_score = $${paramCount++}`);
      values.push(analysisData.sentiment_score);
    }
    
    if (analysisData.category_suggestion !== undefined) {
      fields.push(`category_suggestion = $${paramCount++}`);
      values.push(analysisData.category_suggestion);
    }
    
    if (analysisData.priority_suggestion !== undefined) {
      fields.push(`priority_suggestion = $${paramCount++}`);
      values.push(analysisData.priority_suggestion);
    }
    
    if (analysisData.keywords !== undefined) {
      fields.push(`keywords = $${paramCount++}`);
      values.push(analysisData.keywords);
    }
    
    if (analysisData.summary !== undefined) {
      fields.push(`summary = $${paramCount++}`);
      values.push(analysisData.summary);
    }
    
    if (analysisData.ai_confidence !== undefined) {
      fields.push(`ai_confidence = $${paramCount++}`);
      values.push(analysisData.ai_confidence);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE appeal_analysis 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM appeal_analysis WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rowCount > 0;
  }

  async getAnalysisStats(): Promise<{
    total: number;
    by_sentiment: Record<string, number>;
    avg_confidence: number;
    avg_sentiment_score: number;
    top_keywords: Array<{ keyword: string; count: number }>;
  }> {
    // Total count
    const totalResult = await this.db.query('SELECT COUNT(*) FROM appeal_analysis');
    const total = parseInt(totalResult.rows[0].count);

    // By sentiment
    const sentimentResult = await this.db.query(`
      SELECT sentiment_type, COUNT(*) as count 
      FROM appeal_analysis 
      GROUP BY sentiment_type
    `);
    const by_sentiment = sentimentResult.rows.reduce((acc, row) => {
      acc[row.sentiment_type] = parseInt(row.count);
      return acc;
    }, {});

    // Average confidence
    const confidenceResult = await this.db.query(`
      SELECT AVG(ai_confidence) as avg_confidence 
      FROM appeal_analysis
    `);
    const avg_confidence = parseFloat(confidenceResult.rows[0].avg_confidence) || 0;

    // Average sentiment score
    const sentimentScoreResult = await this.db.query(`
      SELECT AVG(sentiment_score) as avg_sentiment_score 
      FROM appeal_analysis
    `);
    const avg_sentiment_score = parseFloat(sentimentScoreResult.rows[0].avg_sentiment_score) || 0;

    // Top keywords
    const keywordsResult = await this.db.query(`
      SELECT unnest(keywords) as keyword, COUNT(*) as count
      FROM appeal_analysis
      GROUP BY unnest(keywords)
      ORDER BY count DESC
      LIMIT 20
    `);
    const top_keywords = keywordsResult.rows.map(row => ({
      keyword: row.keyword,
      count: parseInt(row.count)
    }));

    return {
      total,
      by_sentiment,
      avg_confidence,
      avg_sentiment_score,
      top_keywords
    };
  }

  async searchByKeywords(keywords: string[], limit = 50, offset = 0): Promise<AppealAnalysis[]> {
    const query = `
      SELECT aa.*, a.subject, a.description, a.status
      FROM appeal_analysis aa
      JOIN appeals a ON aa.appeal_id = a.id
      WHERE aa.keywords && $1
      ORDER BY aa.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.db.query(query, [keywords, limit, offset]);
    return result.rows;
  }
}