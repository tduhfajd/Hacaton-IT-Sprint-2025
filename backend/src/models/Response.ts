import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface Response {
  id: string;
  appeal_id: string;
  operator_id: string;
  message: string;
  response_type: 'internal' | 'public';
  is_ai_generated: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateResponseData {
  appeal_id: string;
  operator_id: string;
  message: string;
  response_type: 'internal' | 'public';
  is_ai_generated?: boolean;
}

export interface UpdateResponseData {
  message?: string;
  response_type?: 'internal' | 'public';
}

export class ResponseModel {
  constructor(private db: Pool) {}

  async create(responseData: CreateResponseData): Promise<Response> {
    const { appeal_id, operator_id, message, response_type, is_ai_generated = false } = responseData;
    
    const id = uuidv4();
    const query = `
      INSERT INTO responses (id, appeal_id, operator_id, message, response_type, is_ai_generated)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [id, appeal_id, operator_id, message, response_type, is_ai_generated];
    const result = await this.db.query(query, values);
    
    return result.rows[0];
  }

  async findById(id: string): Promise<Response | null> {
    const query = 'SELECT * FROM responses WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async findByAppealId(appealId: string, includeInternal = false): Promise<Response[]> {
    let query = `
      SELECT r.*, u.full_name as operator_name
      FROM responses r
      LEFT JOIN users u ON r.operator_id = u.id
      WHERE r.appeal_id = $1
    `;
    
    const values = [appealId];
    
    if (!includeInternal) {
      query += ' AND r.response_type = $2';
      values.push('public');
    }
    
    query += ' ORDER BY r.created_at ASC';
    
    const result = await this.db.query(query, values);
    return result.rows;
  }

  async update(id: string, responseData: UpdateResponseData): Promise<Response | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (responseData.message !== undefined) {
      fields.push(`message = $${paramCount++}`);
      values.push(responseData.message);
    }
    
    if (responseData.response_type !== undefined) {
      fields.push(`response_type = $${paramCount++}`);
      values.push(responseData.response_type);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE responses 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM responses WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rowCount > 0;
  }

  async getResponseStats(operatorId?: string): Promise<{
    total: number;
    by_type: Record<string, number>;
    by_operator: Array<{ operator_name: string; count: number }>;
    ai_generated: number;
  }> {
    // Total count
    let totalQuery = 'SELECT COUNT(*) FROM responses';
    const totalValues = [];
    
    if (operatorId) {
      totalQuery += ' WHERE operator_id = $1';
      totalValues.push(operatorId);
    }
    
    const totalResult = await this.db.query(totalQuery, totalValues);
    const total = parseInt(totalResult.rows[0].count);

    // By type
    let typeQuery = 'SELECT response_type, COUNT(*) as count FROM responses';
    const typeValues = [];
    
    if (operatorId) {
      typeQuery += ' WHERE operator_id = $1';
      typeValues.push(operatorId);
    }
    
    typeQuery += ' GROUP BY response_type';
    
    const typeResult = await this.db.query(typeQuery, typeValues);
    const by_type = typeResult.rows.reduce((acc, row) => {
      acc[row.response_type] = parseInt(row.count);
      return acc;
    }, {});

    // By operator
    let operatorQuery = `
      SELECT u.full_name as operator_name, COUNT(r.id) as count
      FROM responses r
      LEFT JOIN users u ON r.operator_id = u.id
    `;
    const operatorValues = [];
    
    if (operatorId) {
      operatorQuery += ' WHERE r.operator_id = $1';
      operatorValues.push(operatorId);
    }
    
    operatorQuery += ' GROUP BY u.full_name ORDER BY count DESC';
    
    const operatorResult = await this.db.query(operatorQuery, operatorValues);
    const by_operator = operatorResult.rows.map(row => ({
      operator_name: row.operator_name || 'Неизвестно',
      count: parseInt(row.count)
    }));

    // AI generated
    let aiQuery = 'SELECT COUNT(*) FROM responses WHERE is_ai_generated = true';
    const aiValues = [];
    
    if (operatorId) {
      aiQuery += ' AND operator_id = $1';
      aiValues.push(operatorId);
    }
    
    const aiResult = await this.db.query(aiQuery, aiValues);
    const ai_generated = parseInt(aiResult.rows[0].count);

    return {
      total,
      by_type,
      by_operator,
      ai_generated
    };
  }
}