import { Pool } from 'pg';

export interface ChatMessage {
  id: string;
  appeal_id: string;
  sender_id: string;
  sender_type: 'citizen' | 'operator' | 'system';
  message: string;
  message_type: 'text' | 'file' | 'system';
  file_id?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChatMessageData {
  appeal_id: string;
  sender_id: string;
  sender_type: 'citizen' | 'operator' | 'system';
  message: string;
  message_type?: 'text' | 'file' | 'system';
  file_id?: string;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender_name: string;
  sender_email: string;
  file_name?: string;
  file_url?: string;
}

export class ChatMessageModel {
  constructor(private db: Pool) {}

  async create(messageData: CreateChatMessageData): Promise<ChatMessage> {
    const query = `
      INSERT INTO chat_messages (appeal_id, sender_id, sender_type, message, message_type, file_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      messageData.appeal_id,
      messageData.sender_id,
      messageData.sender_type,
      messageData.message,
      messageData.message_type || 'text',
      messageData.file_id || null
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async findByAppealId(appealId: string, limit = 50, offset = 0): Promise<ChatMessageWithSender[]> {
    const query = `
      SELECT 
        cm.*,
        u.full_name as sender_name,
        u.email as sender_email,
        f.original_name as file_name,
        f.file_path as file_url
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      LEFT JOIN files f ON cm.file_id = f.id
      WHERE cm.appeal_id = $1
      ORDER BY cm.created_at ASC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [appealId, limit, offset]);
    return result.rows;
  }

  async findById(id: string): Promise<ChatMessage | null> {
    const query = 'SELECT * FROM chat_messages WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async markAsRead(messageId: string): Promise<boolean> {
    const query = 'UPDATE chat_messages SET is_read = true WHERE id = $1';
    const result = await this.db.query(query, [messageId]);
    return result.rowCount > 0;
  }

  async markAllAsRead(appealId: string, senderId: string): Promise<number> {
    const query = `
      UPDATE chat_messages 
      SET is_read = true 
      WHERE appeal_id = $1 AND sender_id != $2 AND is_read = false
    `;
    const result = await this.db.query(query, [appealId, senderId]);
    return result.rowCount || 0;
  }

  async getUnreadCount(appealId: string, userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM chat_messages 
      WHERE appeal_id = $1 AND sender_id != $2 AND is_read = false
    `;
    const result = await this.db.query(query, [appealId, userId]);
    return parseInt(result.rows[0].count);
  }

  async getLastMessage(appealId: string): Promise<ChatMessageWithSender | null> {
    const query = `
      SELECT 
        cm.*,
        u.full_name as sender_name,
        u.email as sender_email,
        f.original_name as file_name,
        f.file_path as file_url
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      LEFT JOIN files f ON cm.file_id = f.id
      WHERE cm.appeal_id = $1
      ORDER BY cm.created_at DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [appealId]);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM chat_messages WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }

  async getMessageStats(appealId?: string): Promise<{
    total: number;
    by_type: Record<string, number>;
    by_sender_type: Record<string, number>;
    unread: number;
  }> {
    let whereClause = '';
    let params: any[] = [];
    
    if (appealId) {
      whereClause = 'WHERE appeal_id = $1';
      params = [appealId];
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN message_type = 'text' THEN 1 END) as text_messages,
        COUNT(CASE WHEN message_type = 'file' THEN 1 END) as file_messages,
        COUNT(CASE WHEN message_type = 'system' THEN 1 END) as system_messages,
        COUNT(CASE WHEN sender_type = 'citizen' THEN 1 END) as citizen_messages,
        COUNT(CASE WHEN sender_type = 'operator' THEN 1 END) as operator_messages,
        COUNT(CASE WHEN sender_type = 'system' THEN 1 END) as system_sender_messages,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread
      FROM chat_messages
      ${whereClause}
    `;

    const result = await this.db.query(query, params);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      by_type: {
        text: parseInt(row.text_messages),
        file: parseInt(row.file_messages),
        system: parseInt(row.system_messages)
      },
      by_sender_type: {
        citizen: parseInt(row.citizen_messages),
        operator: parseInt(row.operator_messages),
        system: parseInt(row.system_sender_messages)
      },
      unread: parseInt(row.unread)
    };
  }
}