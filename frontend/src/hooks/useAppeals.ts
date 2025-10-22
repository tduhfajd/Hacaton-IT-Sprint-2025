import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

interface Appeal {
  id: string;
  tracking_number: string;
  subject: string;
  description: string;
  category_id?: string;
  category_name?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'processing' | 'completed' | 'rejected';
  address?: string;
  submitted_at: string;
  processed_at?: string;
  completed_at?: string;
  user_name?: string;
}

interface AppealFilters {
  status?: string;
  priority?: string;
  category_id?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface AppealsResponse {
  appeals: Appeal[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

export const useAppeals = () => {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchAppeals = useCallback(async (filters: AppealFilters = {}) => {
    setIsLoading(true);
    try {
      const response = await apiService.getAppeals(filters);
      const data: AppealsResponse = response.data.data;
      
      setAppeals(data.appeals);
      setPagination(data.pagination);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка загрузки обращений';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAppeal = useCallback(async (appealData: {
    subject: string;
    description: string;
    category_id?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    address?: string;
  }) => {
    try {
      const response = await apiService.createAppeal(appealData);
      const data = response.data.data;
      
      toast.success('Обращение создано успешно');
      return { success: true, data };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка создания обращения';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const getAppealById = useCallback(async (id: string) => {
    try {
      const response = await apiService.getAppealById(id);
      return { success: true, data: response.data.data.appeal };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка загрузки обращения';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const getAppealByTrackingNumber = useCallback(async (trackingNumber: string) => {
    try {
      const response = await apiService.getAppealByTrackingNumber(trackingNumber);
      return { success: true, data: response.data.data.appeal };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Обращение не найдено';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const updateAppeal = useCallback(async (id: string, updateData: {
    subject?: string;
    description?: string;
    category_id?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'new' | 'processing' | 'completed' | 'rejected';
    address?: string;
  }) => {
    try {
      const response = await apiService.updateAppeal(id, updateData);
      const data = response.data.data.appeal;
      
      // Update local state
      setAppeals(prev => prev.map(appeal => 
        appeal.id === id ? { ...appeal, ...data } : appeal
      ));
      
      toast.success('Обращение обновлено успешно');
      return { success: true, data };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка обновления обращения';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const deleteAppeal = useCallback(async (id: string) => {
    try {
      await apiService.deleteAppeal(id);
      
      // Remove from local state
      setAppeals(prev => prev.filter(appeal => appeal.id !== id));
      
      toast.success('Обращение удалено успешно');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка удаления обращения';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const getAppealStats = useCallback(async () => {
    try {
      const response = await apiService.getAppealStats();
      return { success: true, data: response.data.data.stats };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка загрузки статистики';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    appeals,
    pagination,
    isLoading,
    fetchAppeals,
    createAppeal,
    getAppealById,
    getAppealByTrackingNumber,
    updateAppeal,
    deleteAppeal,
    getAppealStats,
  };
};