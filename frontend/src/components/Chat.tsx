import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  UserIcon,
  ClockIcon,
  CheckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ChatProps {
  appealId: string;
  className?: string;
}

const Chat: React.FC<ChatProps> = ({ appealId, className = '' }) => {
  const { user } = useAuth();
  const {
    messages,
    unreadCount,
    isLoading,
    isTyping,
    hasMore,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    loadMore
  } = useChat({ appealId });

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when component is visible
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    startTyping();
    stopTyping();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return 'Сегодня';
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return 'Вчера';
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getMessageAlignment = (senderType: string, senderId: string) => {
    if (senderType === 'system') return 'center';
    if (user?.id === senderId) return 'right';
    return 'left';
  };

  const getMessageStyle = (senderType: string, senderId: string) => {
    const alignment = getMessageAlignment(senderType, senderId);
    
    if (senderType === 'system') {
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center text-sm py-2 px-4 rounded-lg mx-auto max-w-md';
    }
    
    if (user?.id === senderId) {
      return 'bg-primary-600 text-white ml-auto max-w-xs lg:max-w-md';
    }
    
    return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 mr-auto max-w-xs lg:max-w-md';
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'operator':
        return '👨‍💼';
      case 'citizen':
        return '👤';
      case 'system':
        return '🤖';
      default:
        return '👤';
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Чат по обращению
          </h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {unreadCount} непрочитанных
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Онлайн</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Загрузка...' : 'Загрузить еще'}
            </button>
          </div>
        )}

        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const showDate = !prevMsg || 
            formatDate(msg.created_at) !== formatDate(prevMsg.created_at);
          
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {formatDate(msg.created_at)}
                  </span>
                </div>
              )}
              
              <div className={`flex ${getMessageAlignment(msg.sender_type, msg.sender_id) === 'right' ? 'justify-end' : getMessageAlignment(msg.sender_type, msg.sender_id) === 'left' ? 'justify-start' : 'justify-center'}`}>
                <div className={`flex items-start space-x-2 ${getMessageAlignment(msg.sender_type, msg.sender_id) === 'right' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {msg.sender_type !== 'system' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm">
                        {getSenderIcon(msg.sender_type)}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col space-y-1">
                    {msg.sender_type !== 'system' && (
                      <div className={`text-xs text-gray-500 dark:text-gray-400 ${getMessageAlignment(msg.sender_type, msg.sender_id) === 'right' ? 'text-right' : 'text-left'}`}>
                        {msg.sender_name}
                      </div>
                    )}
                    
                    <div className={`px-4 py-2 rounded-lg ${getMessageStyle(msg.sender_type, msg.sender_id)}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      
                      {msg.file_name && (
                        <div className="mt-2 flex items-center space-x-2">
                          <PaperClipIcon className="h-4 w-4" />
                          <span className="text-xs underline">{msg.file_name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={`flex items-center space-x-1 text-xs text-gray-400 ${getMessageAlignment(msg.sender_type, msg.sender_id) === 'right' ? 'justify-end' : 'justify-start'}`}>
                      <ClockIcon className="h-3 w-3" />
                      <span>{formatTime(msg.created_at)}</span>
                      {msg.is_read && (
                        <CheckCircleIcon className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicators */}
        {Object.keys(isTyping).length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>Печатает...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Введите сообщение..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            disabled={isSending}
          />
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isSending}
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;