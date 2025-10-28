import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  role: 'citizen' | 'operator' | 'admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: 'citizen' | 'operator' | 'admin';
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  is_active?: boolean;
}

export class UserModel {
  constructor(private db: Pool) {}

  async create(userData: CreateUserData): Promise<User> {
    const { email, password, full_name, phone, role = 'citizen' } = userData;
    
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const id = uuidv4();
    const query = `
      INSERT INTO users (id, email, password_hash, full_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [id, email, password_hash, full_name, phone, role];
    const result = await this.db.query(query, values);
    
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async update(id: string, userData: UpdateUserData): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (userData.full_name !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(userData.full_name);
    }
    
    if (userData.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(userData.phone);
    }
    
    if (userData.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(userData.is_active);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `;
    
    const result = await this.db.query(query, [password_hash, id]);
    return result.rowCount > 0;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rowCount > 0;
  }

  async list(limit = 50, offset = 0, role?: string): Promise<User[]> {
    let query = 'SELECT * FROM users';
    const values = [];
    let paramCount = 1;

    if (role) {
      query += ` WHERE role = $${paramCount++}`;
      values.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(limit, offset);

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async count(role?: string): Promise<number> {
    let query = 'SELECT COUNT(*) FROM users';
    const values = [];

    if (role) {
      query += ' WHERE role = $1';
      values.push(role);
    }

    const result = await this.db.query(query, values);
    return parseInt(result.rows[0].count);
  }
}