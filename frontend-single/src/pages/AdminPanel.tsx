import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAppeals } from '../hooks/useAppeals';
import { useAI } from '../hooks/useAI';
import { 
  UsersIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminPanel: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { appeals, fetchAppeals, isLoading: appealsLoading } = useAppeals();
  const { getAnalysisStats, isLoading: aiLoading } = useAI();
  
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchAppeals(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getAnalysisStats();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'Новые';
      case 'processing':
        return 'В обработке';
      case 'completed':
        return 'Завершенные';
      case 'rejected':
        return 'Отклоненные';
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
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Доступ запрещен
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Требуются права администратора для доступа к этой панели
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: ChartBarIcon },
    { id: 'appeals', name: 'Обращения', icon: DocumentTextIcon },
    { id: 'users', name: 'Пользователи', icon: UsersIcon },
    { id: 'chat', name: 'Чаты', icon: ChatBubbleLeftRightIcon },
    { id: 'settings', name: 'Настройки', icon: CogIcon }
  ];

  const statusCounts = appeals.reduce((acc, appeal) => {
    acc[appeal.status] = (acc[appeal.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityCounts = appeals.reduce((acc, appeal) => {
    acc[appeal.priority] = (acc[appeal.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Административная панель
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Управление системой Smart Assistant for Citizen Appeals
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">Загрузка...</span>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Всего обращений</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{appeals.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Новые</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusCounts.new || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-8 w-8 text-orange-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">В обработке</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusCounts.processing || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Завершенные</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusCounts.completed || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Distribution */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Распределение по статусам
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(statusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status)}
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {getStatusText(status)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Priority Distribution */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Распределение по приоритетам
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(priorityCounts).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                            {priority}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Stats */}
                {stats && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Статистика ИИ-анализа
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Appeals Tab */}
            {activeTab === 'appeals' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Все обращения ({appeals.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Номер
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Тема
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Приоритет
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Дата
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {appeals.map((appeal) => (
                        <tr key={appeal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                            #{appeal.tracking_number}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="max-w-xs truncate">
                              {appeal.subject}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(appeal.status)}
                              <span className="text-sm text-gray-900 dark:text-white">
                                {getStatusText(appeal.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(appeal.priority)}`}>
                              {appeal.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(appeal.submitted_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Управление пользователями
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Функционал управления пользователями будет добавлен в следующих версиях.
                </p>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Управление чатами
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Функционал управления чатами будет добавлен в следующих версиях.
                </p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Настройки системы
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Функционал настроек системы будет добавлен в следующих версиях.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;