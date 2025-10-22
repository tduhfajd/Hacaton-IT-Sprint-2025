import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { accessToken } = response.data.data;
              
              localStorage.setItem('accessToken', accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
  }): Promise<AxiosResponse> {
    return this.api.post('/auth/register', data);
  }

  async login(data: { email: string; password: string }): Promise<AxiosResponse> {
    return this.api.post('/auth/login', data);
  }

  async logout(): Promise<AxiosResponse> {
    return this.api.post('/auth/logout');
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse> {
    return this.api.post('/auth/refresh-token', { refreshToken });
  }

  async getProfile(): Promise<AxiosResponse> {
    return this.api.get('/auth/profile');
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<AxiosResponse> {
    return this.api.post('/auth/change-password', data);
  }

  async resetPassword(email: string): Promise<AxiosResponse> {
    return this.api.post('/auth/reset-password', { email });
  }

  // Appeals endpoints
  async createAppeal(data: {
    subject: string;
    description: string;
    category_id?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    address?: string;
  }): Promise<AxiosResponse> {
    return this.api.post('/appeals', data);
  }

  async getAppeals(params?: {
    status?: string;
    priority?: string;
    category_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AxiosResponse> {
    return this.api.get('/appeals', { params });
  }

  async getAppealById(id: string): Promise<AxiosResponse> {
    return this.api.get(`/appeals/${id}`);
  }

  async getAppealByTrackingNumber(trackingNumber: string): Promise<AxiosResponse> {
    return this.api.get(`/appeals/tracking/${trackingNumber}`);
  }

  async updateAppeal(id: string, data: {
    subject?: string;
    description?: string;
    category_id?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'new' | 'processing' | 'completed' | 'rejected';
    address?: string;
  }): Promise<AxiosResponse> {
    return this.api.put(`/appeals/${id}`, data);
  }

  async deleteAppeal(id: string): Promise<AxiosResponse> {
    return this.api.delete(`/appeals/${id}`);
  }

  async getAppealStats(): Promise<AxiosResponse> {
    return this.api.get('/appeals/stats');
  }

  // Categories endpoints
  async getCategories(activeOnly = true): Promise<AxiosResponse> {
    return this.api.get('/operators/categories', {
      params: { active_only: activeOnly }
    });
  }

  async createCategory(data: {
    name: string;
    description?: string;
  }): Promise<AxiosResponse> {
    return this.api.post('/operators/categories', data);
  }

  async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    is_active?: boolean;
  }): Promise<AxiosResponse> {
    return this.api.put(`/operators/categories/${id}`, data);
  }

  async deleteCategory(id: string): Promise<AxiosResponse> {
    return this.api.delete(`/operators/categories/${id}`);
  }

  // Health check
  async healthCheck(): Promise<AxiosResponse> {
    return this.api.get('/health');
  }
}

export const apiService = new ApiService();
export default apiService;