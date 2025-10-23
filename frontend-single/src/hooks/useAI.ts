import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface AIAnalysis {
  id: string;
  appeal_id: string;
  sentiment_type: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  category_suggestion: string;
  priority_suggestion: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  summary: string;
  ai_confidence: number;
  created_at: string;
}

interface AIGeneratedResponse {
  response: string;
  is_ai_generated: boolean;
}

interface AIStats {
  total: number;
  by_sentiment: Record<string, number>;
  avg_confidence: number;
  avg_sentiment_score: number;
  top_keywords: Array<{ keyword: string; count: number }>;
}

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);

  const analyzeAppeal = useCallback(async (appealId: string): Promise<{
    success: boolean;
    analysis?: AIAnalysis;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.post(`/ai/analyze/${appealId}`);
      
      if (response.data.success) {
        toast.success('Анализ обращения выполнен');
        return { success: true, analysis: response.data.data.analysis };
      } else {
        toast.error(response.data.message || 'Ошибка анализа');
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка анализа обращения';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateResponse = useCallback(async (
    appealId: string, 
    context: string
  ): Promise<{
    success: boolean;
    response?: AIGeneratedResponse;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.post(`/ai/generate-response/${appealId}`, {
        context
      });
      
      if (response.data.success) {
        toast.success('Ответ сгенерирован');
        return { success: true, response: response.data.data };
      } else {
        toast.error(response.data.message || 'Ошибка генерации ответа');
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка генерации ответа';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAnalysis = useCallback(async (appealId: string): Promise<{
    success: boolean;
    analysis?: AIAnalysis;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/ai/analysis/${appealId}`);
      
      if (response.data.success) {
        return { success: true, analysis: response.data.data.analysis };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка получения анализа';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAnalysisStats = useCallback(async (): Promise<{
    success: boolean;
    stats?: AIStats;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/ai/stats');
      
      if (response.data.success) {
        return { success: true, stats: response.data.data.stats };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка получения статистики';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchByKeywords = useCallback(async (
    keywords: string[],
    limit = 50,
    offset = 0
  ): Promise<{
    success: boolean;
    analyses?: AIAnalysis[];
    pagination?: {
      limit: number;
      offset: number;
      total: number;
    };
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/ai/search', {
        params: {
          keywords: keywords.join(','),
          limit,
          offset
        }
      });
      
      if (response.data.success) {
        return { 
          success: true, 
          analyses: response.data.data.analyses,
          pagination: response.data.data.pagination
        };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка поиска';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/ai/test-connection');
      
      if (response.data.success) {
        toast.success('Подключение к GigaChat успешно');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Ошибка подключения');
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка подключения к GigaChat';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    analyzeAppeal,
    generateResponse,
    getAnalysis,
    getAnalysisStats,
    searchByKeywords,
    testConnection
  };
};