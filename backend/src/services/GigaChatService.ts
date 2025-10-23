import axios, { AxiosInstance } from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { AppealAnalysisModel, CreateAnalysisData } from '../models/AppealAnalysis';

interface GigaChatConfig {
  clientId: string;
  scope: string;
  authKey: string;
  authEndpoint: string;
  apiEndpoint: string;
}

interface GigaChatToken {
  access_token: string;
  expires_at: number;
}

interface GigaChatAnalysisResult {
  sentiment: {
    type: 'positive' | 'neutral' | 'negative';
    score: number;
  };
  category_suggestion: string;
  priority_suggestion: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  summary: string;
  confidence: number;
}

export class GigaChatService {
  private httpClient: AxiosInstance;
  private token: GigaChatToken | null = null;
  private config: GigaChatConfig;
  private httpsAgent: https.Agent;

  constructor(private analysisModel: AppealAnalysisModel) {
    this.config = {
      clientId: process.env.GIGACHAT_CLIENT_ID || '4564de21-0d1d-4524-b4e7-cc807691ea32',
      scope: process.env.GIGACHAT_SCOPE || 'GIGACHAT_API_PERS',
      authKey: process.env.GIGACHAT_AUTH_KEY || 'NDU2NGRlMjEtMGQxZC00NTI0LWI0ZTctY2M4MDc2OTFlYTMyOmU4YmVhZGUwLWEzY2MtNDIzMC05N2Q3LWQxOGY4ODcyMmQzMw==',
      authEndpoint: process.env.GIGACHAT_AUTH_ENDPOINT || 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      apiEndpoint: process.env.GIGACHAT_API_ENDPOINT || 'https://gigachat.devices.sberbank.ru'
    };

    // Configure HTTPS agent with certificate or bypass SSL (dev only)
    const certPath = path.join(__dirname, '../../certs/russian_trusted_root_ca.cer');
    
    if (fs.existsSync(certPath)) {
      try {
        const ca = fs.readFileSync(certPath);
        this.httpsAgent = new https.Agent({
          ca: ca,
          rejectUnauthorized: true
        });
        logger.info('GigaChat: Using Russian Trusted Root CA certificate');
      } catch (error) {
        logger.warn('GigaChat: Failed to load certificate, using insecure mode', { error });
        this.httpsAgent = new https.Agent({
          rejectUnauthorized: false
        });
      }
    } else {
      logger.warn('GigaChat: Certificate not found, using insecure mode for development');
      this.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    this.httpClient = axios.create({
      timeout: 30000,
      httpsAgent: this.httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for token refresh
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token.access_token}`;
      }
      return config;
    });
  }

  private async getValidToken(): Promise<GigaChatToken | null> {
    try {
      // Check if current token is still valid
      if (this.token && Date.now() < this.token.expires_at) {
        return this.token;
      }

      // Request new token
      const response = await axios.post(
        this.config.authEndpoint,
        `scope=${this.config.scope}`,
        {
          httpsAgent: this.httpsAgent,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'RqUID': this.generateRqUID(),
            'Authorization': `Basic ${this.config.authKey}`
          }
        }
      );

      if (response.data.access_token) {
        this.token = {
          access_token: response.data.access_token,
          expires_at: Date.now() + (25 * 60 * 1000) // 25 minutes (5 min buffer)
        };

        logger.info('GigaChat token refreshed successfully');
        return this.token;
      }

      throw new Error('No access token in response');
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      const errorStatus = error?.response?.status;
      const errorData = error?.response?.data;
      logger.error('Failed to get GigaChat token', { 
        error: errorMsg, 
        status: errorStatus,
        data: errorData 
      });
      return null;
    }
  }

  private generateRqUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  async analyzeAppeal(appealId: string, subject: string, description: string): Promise<{
    success: boolean;
    analysis?: any;
    error?: string;
  }> {
    try {
      logger.info('Starting GigaChat analysis', { appealId });

      const prompt = this.buildAnalysisPrompt(subject, description);
      const response = await this.sendChatRequest(prompt);

      if (!response.success) {
        return { success: false, error: response.error };
      }

      const analysisResult = this.parseAnalysisResponse(response.data);
      
      // Save analysis to database
      const analysisData: CreateAnalysisData = {
        appeal_id: appealId,
        sentiment_type: analysisResult.sentiment.type,
        sentiment_score: analysisResult.sentiment.score,
        category_suggestion: analysisResult.category_suggestion,
        priority_suggestion: analysisResult.priority_suggestion,
        keywords: analysisResult.keywords,
        summary: analysisResult.summary,
        ai_confidence: analysisResult.confidence
      };

      const savedAnalysis = await this.analysisModel.create(analysisData);

      logger.info('GigaChat analysis completed and saved', { 
        appealId, 
        analysisId: savedAnalysis.id,
        sentiment: analysisResult.sentiment.type,
        confidence: analysisResult.confidence
      });

      return { success: true, analysis: savedAnalysis };
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      logger.error('GigaChat analysis failed', { 
        error: errorMsg, 
        appealId 
      });
      return { success: false, error: 'Analysis failed' };
    }
  }

  private buildAnalysisPrompt(subject: string, description: string): string {
    return `Проанализируй обращение гражданина и предоставь структурированный анализ в формате JSON.

Тема обращения: "${subject}"
Описание: "${description}"

Проанализируй и верни JSON с полями:
{
  "sentiment": {
    "type": "positive|neutral|negative",
    "score": 0.0-1.0
  },
  "category_suggestion": "название категории на русском",
  "priority_suggestion": "low|medium|high|critical",
  "keywords": ["ключевое", "слово1", "слово2"],
  "summary": "краткое резюме обращения на русском (2-3 предложения)",
  "confidence": 0.0-1.0
}

Учти:
- Тональность: положительная (благодарность), нейтральная (информационный запрос), отрицательная (жалоба, критика)
- Категория: выбери наиболее подходящую из: "ЖКХ", "Транспорт", "Благоустройство", "Социальные услуги", "Безопасность", "Образование", "Здравоохранение", "Другое"
- Приоритет: критический (угроза жизни/здоровью), высокий (срочные проблемы), средний (обычные обращения), низкий (информационные запросы)
- Ключевые слова: 3-7 наиболее важных слов/фраз
- Уверенность: насколько точно ИИ может классифицировать обращение

Отвечай только JSON без дополнительного текста.`;
  }

  private async sendChatRequest(prompt: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const token = await this.getValidToken();
      if (!token) {
        return { success: false, error: 'Failed to get authentication token' };
      }

      const response = await this.httpClient.post(
        `${this.config.apiEndpoint}/api/v1/chat/completions`,
        {
          model: "GigaChat:latest",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'RqUID': this.generateRqUID()
          }
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        return { success: false, error: 'No content in response' };
      }

      return { success: true, data: content };
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      logger.error('GigaChat API request failed', { 
        error: errorMsg,
        status: error?.response?.status,
        data: error?.response?.data
      });
      return { success: false, error: 'API request failed' };
    }
  }

  private parseAnalysisResponse(content: string): GigaChatAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      return {
        sentiment: {
          type: this.normalizeSentiment(parsed.sentiment?.type || 'neutral'),
          score: Math.max(0, Math.min(1, parsed.sentiment?.score || 0.5))
        },
        category_suggestion: parsed.category_suggestion || 'Другое',
        priority_suggestion: this.normalizePriority(parsed.priority_suggestion || 'medium'),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 7) : [],
        summary: parsed.summary || 'Анализ не выполнен',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
      };
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      logger.error('Failed to parse GigaChat response', { 
        error: errorMsg, 
        content: content.substring(0, 200) 
      });
      
      // Return default analysis on parse error
      return {
        sentiment: { type: 'neutral', score: 0.5 },
        category_suggestion: 'Другое',
        priority_suggestion: 'medium',
        keywords: [],
        summary: 'Ошибка анализа ИИ',
        confidence: 0.1
      };
    }
  }

  private normalizeSentiment(sentiment: string): 'positive' | 'neutral' | 'negative' {
    const lower = sentiment.toLowerCase();
    if (lower.includes('positive') || lower.includes('позитивн') || lower.includes('благодар')) {
      return 'positive';
    }
    if (lower.includes('negative') || lower.includes('негативн') || lower.includes('жалоб') || lower.includes('критик')) {
      return 'negative';
    }
    return 'neutral';
  }

  private normalizePriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    const lower = priority.toLowerCase();
    if (lower.includes('critical') || lower.includes('критическ') || lower.includes('срочн')) {
      return 'critical';
    }
    if (lower.includes('high') || lower.includes('высок')) {
      return 'high';
    }
    if (lower.includes('low') || lower.includes('низк')) {
      return 'low';
    }
    return 'medium';
  }

  async generateResponse(appealId: string, context: string): Promise<{
    success: boolean;
    response?: string;
    error?: string;
  }> {
    try {
      const prompt = this.buildResponsePrompt(context);
      const result = await this.sendChatRequest(prompt);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, response: result.data };
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      logger.error('GigaChat response generation failed', { 
        error: errorMsg, 
        appealId 
      });
      return { success: false, error: 'Response generation failed' };
    }
  }

  private buildResponsePrompt(context: string): string {
    return `Сгенерируй профессиональный ответ оператора на обращение гражданина.

Контекст: ${context}

Требования к ответу:
- Вежливый и профессиональный тон
- Конкретные действия и сроки
- Контактная информация для уточнений
- Ссылки на нормативные документы при необходимости
- Длина: 2-4 предложения

Ответ должен быть готов к отправке гражданину.`;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getValidToken();
      if (!token) {
        return { success: false, error: 'Failed to get authentication token' };
      }

      const response = await this.httpClient.get(
        `${this.config.apiEndpoint}/api/v1/models`,
        {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'RqUID': this.generateRqUID()
          }
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        logger.info('GigaChat connection test successful', { 
          modelsCount: response.data.data.length 
        });
        return { success: true };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error: any) {
      const errorMsg = error?.message || 'Unknown error';
      logger.error('GigaChat connection test failed', { 
        error: errorMsg,
        status: error?.response?.status
      });
      return { success: false, error: 'Connection test failed' };
    }
  }
}