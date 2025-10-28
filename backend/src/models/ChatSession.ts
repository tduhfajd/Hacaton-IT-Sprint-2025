import { Pool } from 'pg';

export interface ChatSession {
  id: string;
  appeal_id: string;
  operator_id?: string;
  status: 'active' | 'closed' | 'transferred';
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChatSessionData {
  appeal_id: string;
  operator_id?: string;
  status?: 'active' | 'closed' | 'transferred';
}

export interface ChatSessionWithDetails extends ChatSession {
  appeal_subject: string;
  appeal_status: string;
  operator_name?: string;
  operator_email?: string;
  citizen_name: string;
  citizen_email: string;
  message_count: number;
  last_message_at?: string;
}

export class ChatSessionModel {
  constructor(private db: Pool) {}

  async create(sessionData: CreateChatSessionData): Promise<ChatSession> {
    const query = `
      INSERT INTO chat_sessions (appeal_id, operator_id, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      sessionData.appeal_id,
      sessionData.operator_id || null,
      sessionData.status || 'active'
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async findByAppealId(appealId: string): Promise<ChatSession | null> {
    const query = 'SELECT * FROM chat_sessions WHERE appeal_id = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await this.db.query(query, [appealId]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<ChatSession | null> {
    const query = 'SELECT * FROM chat_sessions WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByOperatorId(operatorId: string, status?: string): Promise<ChatSessionWithDetails[]> {
    let whereClause = 'WHERE cs.operator_id = $1';
    let params: any[] = [operatorId];
    
    if (status) {
      whereClause += ' AND cs.status = $2';
      params.push(status);
    }

    const query = `
      SELECT 
        cs.*,
        a.subject as appeal_subject,
        a.status as appeal_status,
        u.full_name as operator_name,
        u.email as operator_email,
        c.full_name as citizen_name,
        c.email as citizen_email,
        COUNT(cm.id) as message_count,
        MAX(cm.created_at) as last_message_at
      FROM chat_sessions cs
      LEFT JOIN appeals a ON cs.appeal_id = a.id
      LEFT JOIN users u ON cs.operator_id = u.id
      LEFT JOIN users c ON a.user_id = c.id
      LEFT JOIN chat_messages cm ON cs.appeal_id = cm.appeal_id
      ${whereClause}
      GROUP BY cs.id, a.subject, a.status, u.full_name, u.email, c.full_name, c.email
      ORDER BY cs.created_at DESC
    `;

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findActiveSessions(): Promise<ChatSessionWithDetails[]> {
    const query = `
      SELECT 
        cs.*,
        a.subject as appeal_subject,
        a.status as appeal_status,
        u.full_name as operator_name,
        u.email as operator_email,
        c.full_name as citizen_name,
        c.email as citizen_email,
        COUNT(cm.id) as message_count,
        MAX(cm.created_at) as last_message_at
      FROM chat_sessions cs
      LEFT JOIN appeals a ON cs.appeal_id = a.id
      LEFT JOIN users u ON cs.operator_id = u.id
      LEFT JOIN users c ON a.user_id = c.id
      LEFT JOIN chat_messages cm ON cs.appeal_id = cm.appeal_id
      WHERE cs.status = 'active'
      GROUP BY cs.id, a.subject, a.status, u.full_name, u.email, c.full_name, c.email
      ORDER BY cs.created_at DESC
    `;

    const result = await this.db.query(query);
    return result.rows;
  }

  async updateStatus(id: string, status: 'active' | 'closed' | 'transferred', operatorId?: string): Promise<ChatSession | null> {
    const query = `
      UPDATE chat_sessions 
      SET status = $1, operator_id = COALESCE($2, operator_id), ended_at = CASE WHEN $1 != 'active' THEN NOW() ELSE ended_at END
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await this.db.query(query, [status, operatorId, id]);
    return result.rows[0] || null;
  }

  async assignOperator(sessionId: string, operatorId: string): Promise<ChatSession | null> {
    const query = `
      UPDATE chat_sessions 
      SET operator_id = $1, status = 'active'
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await this.db.query(query, [operatorId, sessionId]);
    return result.rows[0] || null;
  }

  async closeSession(sessionId: string): Promise<ChatSession | null> {
    const query = `
      UPDATE chat_sessions 
      SET status = 'closed', ended_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.db.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  async getSessionStats(): Promise<{
    total: number;
    active: number;
    closed: number;
    transferred: number;
    avg_duration: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN status = 'transferred' THEN 1 END) as transferred,
        AVG(
          CASE 
            WHEN ended_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
            ELSE NULL 
          END
        ) as avg_duration
      FROM chat_sessions
    `;

    const result = await this.db.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      active: parseInt(row.active),
      closed: parseInt(row.closed),
      transferred: parseInt(row.transferred),
      avg_duration: parseFloat(row.avg_duration) || 0
    };
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM chat_sessions WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }
}