"""
Celery Task: Generate AI Response
Генерирует вариант ответа на основе базы знаний
"""
import os
from celery_app import app
import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'db'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'smart_assistant'),
    'user': os.getenv('DB_USER', 'user'),
    'password': os.getenv('DB_PASSWORD', 'password')
}


@app.task(name='tasks.generate_response')
def generate_response(appeal_id: str, subject: str, description: str):
    """
    Генерирует вариант ответа оператору
    
    Args:
        appeal_id: ID обращения
        subject: Тема (категория)
        description: Текст обращения
    """
    print(f"💬 Generating response for appeal {appeal_id}")
    
    # 1. Поиск релевантных статей в базе знаний
    articles = search_knowledge_base(subject, description)
    
    # 2. Генерация ответа
    if articles:
        # Есть статьи в KB
        article = articles[0]
        suggested_text = f"""Здравствуйте!

По вашему обращению относительно "{subject}" могу предоставить следующую информацию:

{article['content'][:500]}

Если у вас остались вопросы, пожалуйста, уточните.

С уважением,
Служба поддержки"""
        confidence = 0.8
        sources = [article['title']]
    else:
        # Нет статей - общий ответ
        suggested_text = f"""Здравствуйте!

Спасибо за ваше обращение. Я передал вашу информацию в профильный отдел. Специалист свяжется с вами в ближайшее время для решения вопроса.

С уважением,
Служба поддержки"""
        confidence = 0.5
        sources = []
    
    # 3. Сохранить предложенный ответ
    save_response(appeal_id, suggested_text, confidence, sources)
    
    print(f"✅ Response generated for {appeal_id}")
    
    return {
        'appeal_id': appeal_id,
        'suggested_text': suggested_text[:100],
        'confidence': confidence
    }


def search_knowledge_base(category: str, text: str) -> list:
    """Ищет релевантные статьи в базе знаний"""
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Поиск по категории и тексту
            cur.execute("""
                SELECT kb.id, kb.title, kb.content, c.name as category_name
                FROM knowledge_base kb
                LEFT JOIN categories c ON kb.category_id = c.id
                WHERE kb.is_active = true 
                AND (c.name ILIKE %s OR kb.title ILIKE %s OR kb.content ILIKE %s)
                ORDER BY 
                    CASE WHEN c.name ILIKE %s THEN 1 ELSE 2 END,
                    kb.created_at DESC
                LIMIT 3
            """, (f'%{category}%', f'%{text.split()[0]}%', f'%{text.split()[0]}%', f'%{category}%'))
            return cur.fetchall()
    finally:
        conn.close()


def save_response(appeal_id: str, suggested_text: str, confidence: float, sources: list):
    """Сохраняет предложенный ответ в БД"""
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO ai_responses (appeal_id, suggested_text, confidence, sources, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, (appeal_id, suggested_text, confidence, sources))
            conn.commit()
    finally:
        conn.close()

