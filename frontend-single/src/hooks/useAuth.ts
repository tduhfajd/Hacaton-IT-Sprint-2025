import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

interface User {
  userId: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success('Вход выполнен успешно');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка входа';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }) => {
    try {
      const response = await apiService.register(userData);
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      toast.success('Регистрация выполнена успешно');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка регистрации';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      toast.success('Выход выполнен');
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      const response = await apiService.getProfile();
      setAuthState({
        user: response.data.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await apiService.changePassword({ currentPassword, newPassword });
      toast.success('Пароль изменен успешно');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка изменения пароля';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await apiService.resetPassword(email);
      toast.success('Инструкции по восстановлению пароля отправлены на email');
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка восстановления пароля';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    login,
    register,
    logout,
    changePassword,
    resetPassword,
    checkAuth,
  };
};