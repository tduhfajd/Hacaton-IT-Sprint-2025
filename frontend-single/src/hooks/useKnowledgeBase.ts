import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  category_name?: string;
  tags: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CreateArticleData {
  title: string;
  content: string;
  category_id?: string;
  tags: string[];
}

interface UpdateArticleData {
  title?: string;
  content?: string;
  category_id?: string;
  tags?: string[];
  is_active?: boolean;
}

export const useKnowledgeBase = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    pages: 0
  });

  const fetchArticles = useCallback(async (filters: any = {}) => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/knowledge-base', { params: filters });
      
      if (response.data.success) {
        setArticles(response.data.data.articles);
        setPagination(response.data.data.pagination);
        return { success: true, articles: response.data.data.articles };
      } else {
        toast.error(response.data.message || 'Ошибка загрузки статей');
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка загрузки статей';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getArticle = useCallback(async (id: string): Promise<{
    success: boolean;
    article?: KnowledgeArticle;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.get(`/knowledge-base/${id}`);
      
      if (response.data.success) {
        return { success: true, article: response.data.data.article };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка получения статьи';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createArticle = useCallback(async (data: CreateArticleData): Promise<{
    success: boolean;
    article?: KnowledgeArticle;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.post('/knowledge-base', data);
      
      if (response.data.success) {
        toast.success('Статья создана успешно');
        return { success: true, article: response.data.data.article };
      } else {
        toast.error(response.data.message || 'Ошибка создания статьи');
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка создания статьи';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateArticle = useCallback(async (id: string, data: UpdateArticleData): Promise<{
    success: boolean;
    article?: KnowledgeArticle;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.put(`/knowledge-base/${id}`, data);
      
      if (response.data.success) {
        toast.success('Статья обновлена успешно');
        return { success: true, article: response.data.data.article };
      } else {
        toast.error(response.data.message || 'Ошибка обновления статьи');
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка обновления статьи';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteArticle = useCallback(async (id: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.delete(`/knowledge-base/${id}`);
      
      if (response.data.success) {
        toast.success('Статья удалена успешно');
        return { success: true };
      } else {
        toast.error(response.data.message || 'Ошибка удаления статьи');
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка удаления статьи';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchArticles = useCallback(async (query: string, filters: any = {}): Promise<{
    success: boolean;
    articles?: KnowledgeArticle[];
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/knowledge-base/search', {
        params: { q: query, ...filters }
      });
      
      if (response.data.success) {
        return { success: true, articles: response.data.data.articles };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Ошибка поиска статей';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStats = useCallback(async (): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> => {
    try {
      setIsLoading(true);
      const response = await apiService.get('/knowledge-base/stats');
      
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

  return {
    articles,
    pagination,
    isLoading,
    fetchArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    searchArticles,
    getStats
  };
};