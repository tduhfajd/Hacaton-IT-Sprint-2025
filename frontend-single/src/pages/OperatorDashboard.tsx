import React, { useState, useEffect } from 'react';
import { useAppeals } from '../hooks/useAppeals';
import { useAI } from '../hooks/useAI';
import { useAuth } from '../hooks/useAuth';
import AIAnalysis from '../components/AIAnalysis';
import AIResponseGenerator from '../components/AIResponseGenerator';
import { 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface Appeal {
  id: string;
  tracking_number: string;
  subject: string;
  description: string;
  status: 'new' | 'processing' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  submitted_at: string;
  processed_at?: string;
  completed_at?: string;
  category_name?: string;
  user_name?: string;
}

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

const OperatorDashboard: React.FC = () => {
  const { appeals, fetchAppeals, isLoading } = useAppeals();
  const { getAnalysisStats, searchByKeywords, isLoading: aiLoading } = useAI();
  const { isAuthenticated, user } = useAuth();
  
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    await Promise.all([
      fetchAppeals({ status: filters.status === 'all' ? undefined : filters.status }),
      loadStats()
    ]);
  };

  const loadStats = async () => {
    const result = await getAnalysisStats();
    if (result.success) {
      setStats(result.stats);
    }
  };

  const handleAppealSelect = async (appeal: Appeal) => {
    setSelectedAppeal(appeal);
    setShowAI(false);
    
    // Try to get AI analysis for this appeal
    const analysisResult = await getAnalysis(appeal.id);
    if (analysisResult.success && analysisResult.analysis) {
      setSelectedAnalysis(analysisResult.analysis);
    } else {
      setSelectedAnalysis(null);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const filterParams: any = {};
    if (newFilters.status !== 'all') filterParams.status = newFilters.status;
    if (newFilters.priority !== 'all') filterParams.priority = newFilters.priority;
    if (newFilters.search) filterParams.search = newFilters.search;
    
    fetchAppeals(filterParams);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Новое';
      case 'processing':
        return 'В обработке';
      case 'completed':
        return 'Завершено';
      case 'rejected':
        return 'Отклонено';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Требуется авторизация
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Войдите в систему для доступа к панели оператора
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Панель оператора
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Добро пожаловать, {user?.full_name || 'Оператор'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Appeals List */}
          <div className="lg:col-span-1">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Фильтры
              </h3>
              
              <div className="space-y-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Статус
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Все статусы</option>
                    <option value="new">Новые</option>
                    <option value="processing">В обработке</option>
                    <option value="completed">Завершенные</option>
                    <option value="rejected">Отклоненные</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Приоритет
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Все приоритеты</option>
                    <option value="critical">Критический</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Поиск
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Поиск по теме или описанию..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Appeals List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Обращения ({appeals.length})
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Загрузка...</p>
                  </div>
                ) : appeals.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Обращения не найдены
                  </div>
                ) : (
                  appeals.map((appeal) => (
                    <div
                      key={appeal.id}
                      onClick={() => handleAppealSelect(appeal)}
                      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedAppeal?.id === appeal.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(appeal.status)}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            #{appeal.tracking_number}
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(appeal.priority)}`}>
                          {appeal.priority}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {appeal.subject}
                      </h4>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                        {appeal.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{appeal.user_name || 'Гражданин'}</span>
                        <span>{formatDate(appeal.submitted_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Appeal Details */}
          <div className="lg:col-span-2">
            {selectedAppeal ? (
              <div className="space-y-6">
                {/* Appeal Details */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Обращение #{selectedAppeal.tracking_number}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedAppeal.status)}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {getStatusText(selectedAppeal.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {selectedAppeal.subject}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {selectedAppeal.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Категория:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedAppeal.category_name || 'Не указана'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Приоритет:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedAppeal.priority)}`}>
                          {selectedAppeal.priority}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Подано:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedAppeal.submitted_at)}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Автор:</span>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedAppeal.user_name || 'Гражданин'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedAnalysis && (
                  <AIAnalysis analysis={selectedAnalysis} showDetails={true} />
                )}

                {/* AI Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      ИИ-помощник
                    </h3>
                    <button
                      onClick={() => setShowAI(!showAI)}
                      className="btn-outline flex items-center space-x-2"
                    >
                      <CpuChipIcon className="h-4 w-4" />
                      <span>{showAI ? 'Скрыть' : 'Показать'} ИИ-инструменты</span>
                    </button>
                  </div>
                  
                  {showAI && (
                    <AIResponseGenerator
                      appealId={selectedAppeal.id}
                      context={`Обращение #${selectedAppeal.tracking_number}: ${selectedAppeal.subject}`}
                      onResponseGenerated={(response) => {
                        console.log('Generated response:', response);
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Выберите обращение
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Выберите обращение из списка для просмотра деталей и работы с ИИ-помощником
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Статистика ИИ-анализа
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Всего анализов</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.round(stats.avg_confidence * 100)}%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Средняя уверенность</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.by_sentiment.positive || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Позитивных</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.by_sentiment.negative || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Негативных</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDashboard;