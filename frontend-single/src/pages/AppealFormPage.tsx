import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppeals } from '../hooks/useAppeals';
import { useAuth } from '../hooks/useAuth';
import FileUpload from '../components/FileUpload';
import { 
  DocumentTextIcon, 
  UserIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AppealFormData {
  subject: string;
  description: string;
  category_id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  address: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

const AppealFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { createAppeal } = useAppeals();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [createdAppealId, setCreatedAppealId] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<AppealFormData>({
    defaultValues: {
      subject: '',
      description: '',
      category_id: '',
      priority: 'medium',
      address: ''
    }
  });

  const priority = watch('priority');

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/operators/categories`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.data.categories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: AppealFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createAppeal(data);
      
      if (result.success) {
        setCreatedAppealId(result.data.id);
        // Don't navigate immediately, let user upload files first
        if (result.data.tracking_number) {
          // Show success message but stay on page for file upload
        }
      }
    } catch (error) {
      console.error('Error submitting appeal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploadComplete = (files: any[]) => {
    // Navigate to status page after files are uploaded
    if (createdAppealId) {
      navigate('/appeal-status', { 
        state: { 
          trackingNumber: 'AP123456', // This would come from the created appeal
          status: 'new' 
        } 
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Подача обращения
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Заполните форму ниже, и мы обработаем ваше обращение в кратчайшие сроки
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Информация об обращении
            </h2>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Тема обращения *
                </label>
                <input
                  {...register('subject', { 
                    required: 'Тема обращения обязательна',
                    minLength: { value: 5, message: 'Минимум 5 символов' },
                    maxLength: { value: 500, message: 'Максимум 500 символов' }
                  })}
                  className="input"
                  placeholder="Кратко опишите суть проблемы"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.subject.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DocumentTextIcon className="inline h-4 w-4 mr-1" />
                  Подробное описание *
                </label>
                <textarea
                  {...register('description', { 
                    required: 'Описание обязательно',
                    minLength: { value: 20, message: 'Минимум 20 символов' },
                    maxLength: { value: 5000, message: 'Максимум 5000 символов' }
                  })}
                  rows={6}
                  className="input"
                  placeholder="Опишите проблему подробно, укажите адрес, время возникновения и другие важные детали"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Категория
                </label>
                {loadingCategories ? (
                  <div className="input bg-gray-100">
                    Загрузка категорий...
                  </div>
                ) : (
                  <select
                    {...register('category_id')}
                    className="input"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Приоритет обращения
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'low', label: 'Низкий', description: 'Не срочно' },
                    { value: 'medium', label: 'Средний', description: 'Обычная важность' },
                    { value: 'high', label: 'Высокий', description: 'Требует внимания' },
                    { value: 'critical', label: 'Критический', description: 'Очень срочно' }
                  ].map((option) => (
                    <label key={option.value} className="relative">
                      <input
                        type="radio"
                        value={option.value}
                        {...register('priority')}
                        className="sr-only"
                      />
                      <div className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        priority === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{option.label}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(option.value)}`}>
                            {option.label}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPinIcon className="inline h-4 w-4 mr-1" />
                  Адрес (если отличается от места регистрации)
                </label>
                <input
                  {...register('address', { maxLength: { value: 500, message: 'Максимум 500 символов' } })}
                  className="input"
                  placeholder="Укажите точный адрес, где возникла проблема"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* File Upload */}
              {createdAppealId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Прикрепленные файлы (необязательно)
                  </label>
                  <FileUpload
                    appealId={createdAppealId}
                    onUploadComplete={handleFileUploadComplete}
                    maxFiles={5}
                    maxSize={10}
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-4"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Отправка...
                    </div>
                  ) : (
                    'Подать обращение'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppealFormPage;