import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAppeals } from '../hooks/useAppeals';
import { useAI } from '../hooks/useAI';
import AIAnalysis from '../components/AIAnalysis';
import AIResponseGenerator from '../components/AIResponseGenerator';
import Chat from '../components/Chat';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface TrackingInfo {
  appeal: {
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
  };
  responses: Array<{
    id: string;
    message: string;
    response_type: 'internal' | 'public';
    is_ai_generated: boolean;
    created_at: string;
    operator_name?: string;
  }>;
  analysis?: {
    sentiment_type: 'positive' | 'neutral' | 'negative';
    sentiment_score: number;
    summary: string;
    keywords: string[];
    ai_confidence: number;
  };
  timeline: Array<{
    type: 'status_change' | 'response' | 'analysis';
    timestamp: string;
    description: string;
    details?: any;
  }>;
}

const AppealStatusPage: React.FC = () => {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getAppealByTrackingNumber } = useAppeals();
  const { getAnalysis, analyzeAppeal, isLoading: aiLoading } = useAI();
  
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showAI, setShowAI] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const loadTrackingInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if we have tracking number from state (after form submission)
        const stateTrackingNumber = location.state?.trackingNumber;
        const searchTrackingNumber = trackingNumber || stateTrackingNumber;

        if (!searchTrackingNumber) {
          setError('Номер обращения не найден');
          return;
        }

        const result = await getAppealByTrackingNumber(searchTrackingNumber);
        
        if (result.success) {
          // For now, create a mock tracking info
          // In real implementation, this would come from the API
          const mockTrackingInfo: TrackingInfo = {
            appeal: result.data,
            responses: [],
            timeline: [
              {
                type: 'status_change',
                timestamp: result.data.submitted_at,
                description: 'Обращение создано',
                details: { status: 'new' }
              }
            ]
          };
          
          setTrackingInfo(mockTrackingInfo);
          
          // Try to get AI analysis
          const analysisResult = await getAnalysis(result.data.id);
          if (analysisResult.success && analysisResult.analysis) {
            setAiAnalysis(analysisResult.analysis);
          }
        } else {
          setError(result.error || 'Обращение не найдено');
        }
      } catch (err) {
        setError('Ошибка загрузки информации об обращении');
        console.error('Error loading tracking info:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTrackingInfo();
  }, [trackingNumber, location.state, getAppealByTrackingNumber]);

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
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Загрузка информации об обращении...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error || 'Обращение не найдено'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-500 mb-4"
          >
            ← Вернуться на главную
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Отслеживание обращения
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Номер обращения: <span className="font-mono font-semibold">{trackingInfo.appeal.tracking_number}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appeal Details */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Детали обращения
                </h2>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      {trackingInfo.appeal.subject}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {trackingInfo.appeal.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Категория:</span>
                      <p className="text-gray-900 dark:text-white">
                        {trackingInfo.appeal.category_name || 'Не указана'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Приоритет:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(trackingInfo.appeal.priority)}`}>
                        {trackingInfo.appeal.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  История обращения
                </h2>
              </div>
              <div className="card-content">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {trackingInfo.timeline.map((event, eventIdx) => (
                      <li key={eventIdx}>
                        <div className="relative pb-8">
                          {eventIdx !== trackingInfo.timeline.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                                {event.type === 'status_change' && getStatusIcon(event.details?.status)}
                                {event.type === 'response' && <ChatBubbleLeftRightIcon className="h-4 w-4 text-primary-600" />}
                                {event.type === 'analysis' && <DocumentTextIcon className="h-4 w-4 text-primary-600" />}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {event.description}
                                </p>
                                {event.details && (
                                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {event.type === 'response' && event.details.is_ai_generated && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Сгенерировано ИИ
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {formatDate(event.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Responses */}
            {trackingInfo.responses.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Ответы операторов
                  </h2>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    {trackingInfo.responses.map((response) => (
                      <div key={response.id} className="border-l-4 border-primary-200 dark:border-primary-800 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {response.operator_name || 'Оператор'}
                            </span>
                            {response.is_ai_generated && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                ИИ
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(response.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          {response.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="card">
              <div className="card-content">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(trackingInfo.appeal.status)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {getStatusText(trackingInfo.appeal.status)}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Текущий статус
                  </p>
                </div>
              </div>
            </div>

            {/* Appeal Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Информация
                </h3>
              </div>
              <div className="card-content">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Дата подачи
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      {formatDate(trackingInfo.appeal.submitted_at)}
                    </dd>
                  </div>
                  
                  {trackingInfo.appeal.processed_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Взято в обработку
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {formatDate(trackingInfo.appeal.processed_at)}
                      </dd>
                    </div>
                  )}
                  
                  {trackingInfo.appeal.completed_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {trackingInfo.appeal.status === 'completed' ? 'Завершено' : 'Отклонено'}
                      </dt>
                      <dd className="text-sm text-gray-900 dark:text-white">
                        {formatDate(trackingInfo.appeal.completed_at)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* AI Analysis */}
            {aiAnalysis && (
              <AIAnalysis analysis={aiAnalysis} showDetails={false} />
            )}

            {/* AI Actions for Operators */}
            {trackingInfo && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    ИИ-помощник
                  </h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    {!aiAnalysis && (
                      <button
                        onClick={async () => {
                          const result = await analyzeAppeal(trackingInfo.appeal.id);
                          if (result.success) {
                            setAiAnalysis(result.analysis);
                          }
                        }}
                        disabled={aiLoading}
                        className="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <CpuChipIcon className="h-4 w-4" />
                        <span>{aiLoading ? 'Анализ...' : 'Проанализировать обращение'}</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowAI(!showAI)}
                      className="w-full btn-outline flex items-center justify-center space-x-2"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      <span>{showAI ? 'Скрыть генератор ответов' : 'Сгенерировать ответ'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Response Generator */}
            {showAI && trackingInfo && (
              <AIAnalysis analysis={aiAnalysis} showDetails={true} />
            )}

            {showAI && trackingInfo && (
              <AIResponseGenerator
                appealId={trackingInfo.appeal.id}
                context={`Обращение #${trackingInfo.appeal.tracking_number}: ${trackingInfo.appeal.subject}`}
                onResponseGenerated={(response) => {
                  // Handle generated response
                  console.log('Generated response:', response);
                }}
              />
            )}
          </div>
        </div>

        {/* Chat Section */}
        {showChat && (
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-96">
                <Chat appealId={trackingInfo.appeal.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppealStatusPage;