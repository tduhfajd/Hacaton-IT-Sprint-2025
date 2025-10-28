import { Pool } from 'pg';

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export class CategoryModel {
  constructor(private db: Pool) {}

  async create(categoryData: CreateCategoryData): Promise<Category> {
    const { name, description } = categoryData;
    
    const query = `
      INSERT INTO categories (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    const values = [name, description];
    const result = await this.db.query(query, values);
    
    return result.rows[0];
  }

  async findById(id: string): Promise<Category | null> {
    const query = 'SELECT * FROM categories WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rows[0] || null;
  }

  async findByName(name: string): Promise<Category | null> {
    const query = 'SELECT * FROM categories WHERE name = $1';
    const result = await this.db.query(query, [name]);
    
    return result.rows[0] || null;
  }

  async update(id: string, categoryData: UpdateCategoryData): Promise<Category | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (categoryData.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(categoryData.name);
    }
    
    if (categoryData.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(categoryData.description);
    }
    
    if (categoryData.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(categoryData.is_active);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE categories 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM categories WHERE id = $1';
    const result = await this.db.query(query, [id]);
    
    return result.rowCount > 0;
  }

  async list(activeOnly = true): Promise<Category[]> {
    let query = 'SELECT * FROM categories';
    const values = [];

    if (activeOnly) {
      query += ' WHERE is_active = $1';
      values.push(true);
    }

    query += ' ORDER BY name ASC';

    const result = await this.db.query(query, values);
    return result.rows;
  }

  async count(activeOnly = true): Promise<number> {
    let query = 'SELECT COUNT(*) FROM categories';
    const values = [];

    if (activeOnly) {
      query += ' WHERE is_active = $1';
      values.push(true);
    }

    const result = await this.db.query(query, values);
    return parseInt(result.rows[0].count);
  }
}