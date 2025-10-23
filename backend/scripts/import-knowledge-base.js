/**
 * Скрипт для импорта базы знаний из markdown файлов в PostgreSQL
 * 
 * Использование:
 * node scripts/import-knowledge-base.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Конфигурация БД
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'smart_assistant',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Путь к файлам базы знаний
const KNOWLEDGE_BASE_DIR = path.join(__dirname, '../../knowledge_base/manual');

// Маппинг файлов на категории
const FILE_CATEGORY_MAP = {
  'blagooustroystvo.md': 'Благоустройство',
  'dvory-i-territorii.md': 'Благоустройство',
  'elektrosnabzhenie.md': 'ЖКУ',
  'teplosnabzhenie.md': 'ЖКУ',
  'vodosnabzhenie.md': 'ЖКУ',
  'plata-za-zhku.md': 'ЖКУ',
  'musor.md': 'ЖКУ',
  'mnogokvartirnye-doma.md': 'ЖКУ',
  'parki-kultury-i-otdykha.md': 'Благоустройство',
  'socialnaya-gazifikatsiya.md': 'Социальная защита',
  'inoe.md': 'Другое',
  'test_queries.md': 'Другое'
};

// Извлечение заголовка из markdown
function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Без заголовка';
}

// Извлечение тегов из контента
function extractTags(filename, content) {
  const tags = [];
  
  // Добавляем теги на основе имени файла
  const basename = filename.replace('.md', '').replace(/-/g, ' ');
  tags.push(basename);
  
  // Извлекаем ключевые слова из заголовков
  const headers = content.match(/^##\s+(.+)$/gm);
  if (headers) {
    headers.forEach(header => {
      const tag = header.replace(/^##\s+/, '').trim();
      if (tag.length < 50) { // Только короткие заголовки
        tags.push(tag);
      }
    });
  }
  
  return tags;
}

// Получение ID категории
async function getCategoryId(categoryName) {
  try {
    const result = await pool.query(
      'SELECT id FROM categories WHERE name = $1 LIMIT 1',
      [categoryName]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].id;
    }
    
    // Если категория не найдена, вернем категорию "Другое"
    const defaultResult = await pool.query(
      'SELECT id FROM categories WHERE name = $1 LIMIT 1',
      ['Другое']
    );
    
    return defaultResult.rows[0]?.id || null;
  } catch (error) {
    console.error(`Error getting category ID for ${categoryName}:`, error.message);
    return null;
  }
}

// Импорт одного файла
async function importFile(filename) {
  try {
    const filePath = path.join(KNOWLEDGE_BASE_DIR, filename);
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filename}`);
      return false;
    }
    
    // Читаем контент
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (!content || content.trim().length === 0) {
      console.log(`⚠️  Empty file: ${filename}`);
      return false;
    }
    
    // Извлекаем данные
    const title = extractTitle(content);
    const tags = extractTags(filename, content);
    const categoryName = FILE_CATEGORY_MAP[filename] || 'Другое';
    const categoryId = await getCategoryId(categoryName);
    
    // Проверяем, существует ли уже запись
    const checkQuery = 'SELECT id FROM knowledge_base WHERE title = $1 LIMIT 1';
    const existingResult = await pool.query(checkQuery, [title]);
    
    let result;
    if (existingResult.rows.length > 0) {
      // Обновляем существующую запись
      const updateQuery = `
        UPDATE knowledge_base 
        SET content = $1, category_id = $2, tags = $3, updated_at = NOW()
        WHERE title = $4
        RETURNING id
      `;
      result = await pool.query(updateQuery, [content, categoryId, tags, title]);
      console.log(`🔄 Updated: ${filename} (${title}) - ID: ${result.rows[0].id}`);
    } else {
      // Вставляем новую запись
      const insertQuery = `
        INSERT INTO knowledge_base (title, content, category_id, tags, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        RETURNING id
      `;
      result = await pool.query(insertQuery, [title, content, categoryId, tags]);
      console.log(`✅ Inserted: ${filename} (${title}) - ID: ${result.rows[0].id}`);
    }
    
    console.log(`✅ Imported: ${filename} (${title}) - ID: ${result.rows[0].id}`);
    return true;
  } catch (error) {
    console.error(`❌ Error importing ${filename}:`, error.message);
    return false;
  }
}

// Главная функция
async function main() {
  console.log('🚀 Starting knowledge base import...\n');
  
  try {
    // Проверяем подключение к БД
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');
    
    // Проверяем директорию
    if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) {
      console.error(`❌ Directory not found: ${KNOWLEDGE_BASE_DIR}`);
      process.exit(1);
    }
    
    // Получаем список файлов
    const files = Object.keys(FILE_CATEGORY_MAP);
    console.log(`📁 Found ${files.length} files to import\n`);
    
    // Импортируем каждый файл
    let successCount = 0;
    let failCount = 0;
    
    for (const filename of files) {
      const success = await importFile(filename);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log('='.repeat(50));
    
    // Показываем статистику
    const statsResult = await pool.query(`
      SELECT 
        c.name as category,
        COUNT(kb.id) as count
      FROM knowledge_base kb
      JOIN categories c ON kb.category_id = c.id
      WHERE kb.is_active = true
      GROUP BY c.name
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Knowledge base statistics:');
    statsResult.rows.forEach(row => {
      console.log(`   ${row.category}: ${row.count} entries`);
    });
    
    console.log('\n✨ Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запуск
main().catch(console.error);

