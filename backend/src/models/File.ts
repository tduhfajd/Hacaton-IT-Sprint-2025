import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export interface File {
  id: string;
  appeal_id: string;
  original_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: Date;
}

export interface CreateFileData {
  appeal_id: string;
  original_name: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
}

export interface FileFilters {
  appeal_id?: string;
  uploaded_by?: string;
  mime_type?: string;
  date_from?: string;
  date_to?: string;
}

export class FileModel {
  constructor(private db: Pool) {}

  async create(fileData: CreateFileData): Promise<File> {
    const { appeal_id, original_name, file_name, file_path, file_size, mime_type, uploaded_by } = fileData;
    
    const id = uuidv4();
    const query = `
      INSERT INTO files (id, appeal_id, original_name, file_name, file_path, file_size, mime_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [id, appeal_id, original_name, file_name, file_path, file_size, mime_type, uploaded_by];
    const result = await this.db.query(query, values);
    
    return result.rows[0];
  }

  async findById(id: string): Promise<File | null> {
    const query = 'SELECT * FROM files WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async findByAppealId(appealId: string): Promise<File[]> {
    const query = 'SELECT * FROM files WHERE appeal_id = $1 ORDER BY created_at ASC';
    const result = await this.db.query(query, [appealId]);
    
    return result.rows;
  }

  async list(filters: FileFilters = {}, limit = 50, offset = 0): Promise<File[]> {
    let query = 'SELECT * FROM files';
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.appeal_id) {
      conditions.push(`appeal_id = $${paramCount++}`);
      values.push(filters.appeal_id);
    }
    
    if (filters.uploaded_by) {
      conditions.push(`uploaded_by = $${paramCount++}`);
      values.push(filters.uploaded_by);
    }
    
    if (filters.mime_type) {
      conditions.push(`mime_type = $${paramCount++}`);
      values.push(filters.mime_type);
    }
    
    if (filters.date_from) {
      conditions.push(`created_at >= $${paramCount++}`);
      values.push(filters.date_from);
    }
    
    if (filters.date_to) {
      conditions.push(`created_at <= $${paramCount++}`);
      values.push(filters.date_to);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async count(filters: FileFilters = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM files';
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.appeal_id) {
      conditions.push(`appeal_id = $${paramCount++}`);
      values.push(filters.appeal_id);
    }
    
    if (filters.uploaded_by) {
      conditions.push(`uploaded_by = $${paramCount++}`);
      values.push(filters.uploaded_by);
    }
    
    if (filters.mime_type) {
      conditions.push(`mime_type = $${paramCount++}`);
      values.push(filters.mime_type);
    }
    
    if (filters.date_from) {
      conditions.push(`created_at >= $${paramCount++}`);
      values.push(filters.date_from);
    }
    
    if (filters.date_to) {
      conditions.push(`created_at <= $${paramCount++}`);
      values.push(filters.date_to);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await this.db.query(query, values);
    return parseInt(result.rows[0].count);
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Get file info before deleting
      const file = await this.findById(id);
      if (!file) {
        return false;
      }

      // Delete from database
      const query = 'DELETE FROM files WHERE id = $1';
      const result = await this.db.query(query, [id]);
      
      if (result.rowCount === 0) {
        return false;
      }

      // Delete physical file
      const fullPath = path.join(process.env.UPLOAD_DIR || './uploads', file.file_path);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  async getFileStats(): Promise<{
    total: number;
    total_size: number;
    by_type: Record<string, number>;
    by_appeal: Array<{ appeal_id: string; count: number }>;
  }> {
    // Total count and size
    const totalResult = await this.db.query('SELECT COUNT(*), SUM(file_size) FROM files');
    const total = parseInt(totalResult.rows[0].count);
    const total_size = parseInt(totalResult.rows[0].sum) || 0;

    // By type
    const typeResult = await this.db.query(`
      SELECT mime_type, COUNT(*) as count 
      FROM files 
      GROUP BY mime_type
    `);
    const by_type = typeResult.rows.reduce((acc, row) => {
      acc[row.mime_type] = parseInt(row.count);
      return acc;
    }, {});

    // By appeal
    const appealResult = await this.db.query(`
      SELECT appeal_id, COUNT(*) as count
      FROM files
      GROUP BY appeal_id
      ORDER BY count DESC
      LIMIT 20
    `);
    const by_appeal = appealResult.rows.map(row => ({
      appeal_id: row.appeal_id,
      count: parseInt(row.count)
    }));

    return {
      total,
      total_size,
      by_type,
      by_appeal
    };
  }

  async validateFile(file: Express.Multer.File): Promise<{ valid: boolean; error?: string }> {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed`
      };
    }

    return { valid: true };
  }

  generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${name}_${timestamp}_${random}${ext}`;
  }
}