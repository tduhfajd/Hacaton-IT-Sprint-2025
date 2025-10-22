import React from 'react';
import { 
  CpuChipIcon, 
  ChartBarIcon, 
  TagIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface AIAnalysisProps {
  analysis: {
    id: string;
    sentiment_type: 'positive' | 'neutral' | 'negative';
    sentiment_score: number;
    category_suggestion: string;
    priority_suggestion: 'low' | 'medium' | 'high' | 'critical';
    keywords: string[];
    summary: string;
    ai_confidence: number;
    created_at: string;
  };
  showDetails?: boolean;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ analysis, showDetails = true }) => {
  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'negative':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'Позитивная';
      case 'negative':
        return 'Негативная';
      default:
        return 'Нейтральная';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'negative':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'Критический';
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return priority;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Высокая';
    if (confidence >= 0.6) return 'Средняя';
    return 'Низкая';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <CpuChipIcon className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Анализ ИИ
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(analysis.created_at).toLocaleString('ru-RU')}
        </span>
      </div>

      {/* Summary */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Резюме
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {analysis.summary}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Sentiment */}
        <div className="flex items-center space-x-2">
          {getSentimentIcon(analysis.sentiment_type)}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Тональность</p>
            <p className={`text-sm font-medium ${getSentimentColor(analysis.sentiment_type)} px-2 py-1 rounded-full inline-block`}>
              {getSentimentText(analysis.sentiment_type)}
            </p>
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Приоритет</p>
            <p className={`text-sm font-medium ${getPriorityColor(analysis.priority_suggestion)} px-2 py-1 rounded-full inline-block`}>
              {getPriorityText(analysis.priority_suggestion)}
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center space-x-2">
          <TagIcon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Категория</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {analysis.category_suggestion}
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Уверенность ИИ</p>
            <p className={`text-sm font-medium ${getConfidenceColor(analysis.ai_confidence)}`}>
              {getConfidenceText(analysis.ai_confidence)} ({Math.round(analysis.ai_confidence * 100)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Keywords */}
      {analysis.keywords && analysis.keywords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ключевые слова
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Детальные показатели
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Оценка тональности</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.sentiment_score >= 0.6 ? 'bg-green-500' :
                      analysis.sentiment_score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.abs(analysis.sentiment_score - 0.5) * 200}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(analysis.sentiment_score * 100)}%
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Уверенность анализа</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.ai_confidence >= 0.8 ? 'bg-green-500' :
                      analysis.ai_confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.ai_confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(analysis.ai_confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;