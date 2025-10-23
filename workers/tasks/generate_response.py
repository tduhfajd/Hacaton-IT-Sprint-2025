"""
Celery Task: Generate AI Response
Генерирует вариант ответа на основе базы знаний
"""
import os
import re
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
        # Есть статьи в KB - генерируем человекоподобный ответ
        article = articles[0]
        
        # Генерируем персонализированный ответ на основе статьи
        suggested_text = generate_human_like_response(
            question=description,
            category=subject,
            knowledge_base_article=article['content'],
            article_title=article['title']
        )
        
        confidence = 0.85
        sources = [article['title']]
        print(f"✅ Найдена статья в БЗ: {article['title']}")
        print(f"✅ Сгенерирован персонализированный ответ")
    else:
        # ⚠️ Нет статей - профессиональный ответ для гражданина
        # Оператор увидит низкий confidence и поймёт что нужна ручная обработка
        suggested_text = f"""Здравствуйте!

Благодарю вас за обращение. 

Для решения вашего вопроса потребуется дополнительное время. Я уточню необходимую информацию у профильного специалиста и обязательно свяжусь с вами в ближайшее время.

Пожалуйста, ожидайте моего ответа.

С уважением,
Служба поддержки"""
        confidence = 0.3  # Низкая уверенность = сигнал оператору что нужна ручная обработка
        sources = []
        print(f"⚠️ Статьи НЕ НАЙДЕНЫ для категории '{subject}'")
        print(f"⚠️ Низкий confidence (0.3) - оператор увидит что нужна ручная обработка")
        print(f"⚠️ Рекомендуется добавить информацию в базу знаний")
    
    # 3. Сохранить предложенный ответ
    save_response(appeal_id, suggested_text, confidence, sources)
    
    print(f"✅ Response generated for {appeal_id}")
    
    return {
        'appeal_id': appeal_id,
        'suggested_text': suggested_text[:100],
        'confidence': confidence
    }


def generate_human_like_response(question: str, category: str, knowledge_base_article: str, article_title: str) -> str:
    """
    Генерирует человекоподобный ответ на основе статьи из базы знаний
    Использует простую логику извлечения релевантной информации
    """
    # Извлекаем ключевые слова из вопроса
    keywords = extract_keywords(question)
    
    # Находим релевантные секции в статье
    relevant_sections = find_relevant_sections(knowledge_base_article, keywords)
    
    # Формируем структурированный ответ
    if relevant_sections:
        # Есть конкретная информация по вопросу
        answer_parts = []
        answer_parts.append("Здравствуйте!")
        answer_parts.append("")
        answer_parts.append(f"Отвечаю на ваш вопрос по теме \"{category}\":")
        answer_parts.append("")
        
        # Добавляем релевантные части
        for section in relevant_sections[:3]:  # Максимум 3 секции
            answer_parts.append(section)
            answer_parts.append("")
        
        answer_parts.append("Если у вас есть дополнительные вопросы или требуется уточнение, пожалуйста, напишите.")
        answer_parts.append("")
        answer_parts.append("С уважением,")
        answer_parts.append("Служба поддержки")
        
        return "\n".join(answer_parts)
    else:
        # Общий ответ со всей информацией из статьи
        content_preview = knowledge_base_article[:1000]
        last_period = content_preview.rfind('.')
        if last_period > 300:
            content_preview = content_preview[:last_period + 1]
        
        return f"""Здравствуйте!

Благодарю за ваше обращение по теме "{category}".

{content_preview}

Если вам нужна более детальная информация или возникли дополнительные вопросы, пожалуйста, уточните.

С уважением,
Служба поддержки"""


def extract_keywords(text: str) -> list:
    """Извлекает ключевые слова из текста"""
    # Удаляем стоп-слова и короткие слова
    stop_words = {'как', 'что', 'где', 'когда', 'почему', 'это', 'для', 'при', 'или', 'нужно', 'можно', 'есть'}
    words = re.findall(r'\b\w+\b', text.lower())
    keywords = [w for w in words if len(w) > 3 and w not in stop_words]
    return keywords[:10]  # Первые 10 ключевых слов


def find_relevant_sections(article: str, keywords: list) -> list:
    """Находит релевантные секции в статье на основе ключевых слов"""
    sections = []
    
    # Убираем все заголовки markdown и разбиваем на параграфы
    clean_article = re.sub(r'^#+\s+.+$', '', article, flags=re.MULTILINE)
    paragraphs = [p.strip() for p in clean_article.split('\n') if p.strip()]
    
    # Объединяем короткие строки в параграфы (пункты списков и т.д.)
    combined_paragraphs = []
    current = []
    
    for para in paragraphs:
        current.append(para)
        # Если параграф заканчивается точкой или набралось 3+ строки
        if para.endswith('.') or para.endswith('?') or para.endswith('!') or len(current) >= 3:
            combined = ' '.join(current)
            if len(combined) > 50:  # Только значимые параграфы
                combined_paragraphs.append(combined)
            current = []
    
    if current:  # Остаток
        combined = ' '.join(current)
        if len(combined) > 50:
            combined_paragraphs.append(combined)
    
    # Ищем параграфы с ключевыми словами
    for paragraph in combined_paragraphs:
        # Подсчитываем совпадения ключевых слов
        matches = sum(1 for keyword in keywords if keyword in paragraph.lower())
        
        if matches > 0:
            # Очищаем от markdown
            clean_para = re.sub(r'\*\*(.+?)\*\*', r'\1', paragraph)
            clean_para = re.sub(r'^[\-\*]\s+', '', clean_para)
            sections.append((matches, clean_para))
    
    # Сортируем по количеству совпадений и берем лучшие
    sections.sort(reverse=True, key=lambda x: x[0])
    return [s[1] for s in sections[:4]]  # Топ-4 релевантных секции


def search_knowledge_base(category: str, text: str) -> list:
    """Ищет релевантные статьи в базе знаний с улучшенным поиском"""
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Извлекаем ключевые слова из текста (первые 3-5 значимых слов)
            words = [w.strip('.,!?;:').lower() for w in text.split() if len(w) > 3][:5]
            
            # Поиск по категории (приоритет 1)
            cur.execute("""
                SELECT kb.id, kb.title, kb.content, c.name as category_name, 1 as relevance
                FROM knowledge_base kb
                LEFT JOIN categories c ON kb.category_id = c.id
                WHERE kb.is_active = true AND c.name ILIKE %s
                LIMIT 2
            """, (f'%{category}%',))
            results = list(cur.fetchall())
            
            # Если не нашли по категории, ищем по ключевым словам
            if not results and words:
                search_pattern = ' | '.join(words)  # PostgreSQL full-text search
                cur.execute("""
                    SELECT kb.id, kb.title, kb.content, c.name as category_name, 2 as relevance
                    FROM knowledge_base kb
                    LEFT JOIN categories c ON kb.category_id = c.id
                    WHERE kb.is_active = true 
                    AND (kb.title ILIKE %s OR kb.content ILIKE %s OR %s = ANY(kb.tags))
                    ORDER BY kb.created_at DESC
                    LIMIT 2
                """, (f'%{words[0]}%', f'%{words[0]}%', words[0]))
                results = list(cur.fetchall())
            
            return results
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

