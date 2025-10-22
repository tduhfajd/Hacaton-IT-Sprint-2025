import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';
import { 
  CpuChipIcon, 
  SparklesIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AIResponseGeneratorProps {
  appealId: string;
  onResponseGenerated?: (response: string) => void;
  context?: string;
}

const AIResponseGenerator: React.FC<AIResponseGeneratorProps> = ({
  appealId,
  onResponseGenerated,
  context = ''
}) => {
  const { generateResponse, isLoading } = useAI();
  const [customContext, setCustomContext] = useState(context);
  const [generatedResponse, setGeneratedResponse] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!customContext.trim()) {
      return;
    }

    const result = await generateResponse(appealId, customContext);
    
    if (result.success && result.response) {
      setGeneratedResponse(result.response.response);
      setIsGenerated(true);
      onResponseGenerated?.(result.response.response);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedResponse);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleUseResponse = () => {
    onResponseGenerated?.(generatedResponse);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <CpuChipIcon className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Генератор ответов ИИ
        </h3>
        <SparklesIcon className="h-5 w-5 text-yellow-500" />
      </div>

      {/* Context Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Контекст для генерации ответа
        </label>
        <textarea
          value={customContext}
          onChange={(e) => setCustomContext(e.target.value)}
          placeholder="Опишите дополнительный контекст, который поможет ИИ сгенерировать более точный ответ..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          rows={3}
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Чем подробнее контекст, тем точнее будет сгенерированный ответ
        </p>
      </div>

      {/* Generate Button */}
      <div className="mb-4">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !customContext.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Генерация...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              <span>Сгенерировать ответ</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Response */}
      {isGenerated && generatedResponse && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Сгенерированный ответ
            </h4>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                <CpuChipIcon className="h-3 w-3 mr-1" />
                ИИ
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {generatedResponse}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-2" />
              Копировать
            </button>
            
            <button
              onClick={handleUseResponse}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Использовать ответ
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h5 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
          💡 Советы для лучшего результата:
        </h5>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Укажите конкретные действия, которые планируете предпринять</li>
          <li>• Добавьте информацию о сроках решения вопроса</li>
          <li>• Включите контактную информацию для уточнений</li>
          <li>• Упомяните нормативные документы, если применимо</li>
        </ul>
      </div>
    </div>
  );
};

export default AIResponseGenerator;