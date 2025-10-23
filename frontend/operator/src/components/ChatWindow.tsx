import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../config';

interface Message {
  id: string;
  appeal_id: string;
  sender_id: string;
  sender_type: 'citizen' | 'operator';
  message_text: string;
  created_at: string;
}

interface ChatWindowProps {
  appealId: string;
  operatorId: string;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ appealId, operatorId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [citizenTyping, setCitizenTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Подключение к WebSocket
    const socket = io(WS_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    // События подключения
    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      setConnected(true);
      
      // Присоединяемся к комнате обращения
      socket.emit('join_appeal', {
        appealId,
        userId: operatorId,
        userType: 'operator'
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      setConnected(false);
    });

    // История чата
    socket.on('chat_history', (history: Message[]) => {
      console.log('📜 Received chat history:', history.length, 'messages');
      setMessages(history);
    });

    // Новое сообщение
    socket.on('new_message', (message: Message) => {
      console.log('💬 New message:', message);
      setMessages(prev => [...prev, message]);
    });

    // Индикатор печати
    socket.on('user_typing', (data: { userId: string; userType: string; isTyping: boolean }) => {
      if (data.userType === 'citizen') {
        setCitizenTyping(data.isTyping);
      }
    });

    // Пользователь присоединился
    socket.on('user_joined', (data: { userId: string; userType: string }) => {
      console.log('👋 User joined:', data);
    });

    // Пользователь покинул
    socket.on('user_left', (data: { userId: string }) => {
      console.log('👋 User left:', data);
    });

    // Ошибка
    socket.on('error', (error: { message: string }) => {
      console.error('❌ Chat error:', error);
      alert('Ошибка чата: ' + error.message);
    });

    // Очистка при размонтировании
    return () => {
      if (socket) {
        socket.emit('leave_appeal', { appealId, userId: operatorId });
        socket.disconnect();
      }
    };
  }, [appealId, operatorId]);

  // Прокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socketRef.current) return;

    // Отправка сообщения
    socketRef.current.emit('send_message', {
      appealId,
      senderId: operatorId,
      senderType: 'operator',
      message: newMessage.trim()
    });

    setNewMessage('');
    setIsTyping(false);
    
    // Отправка индикатора печати (не печатаем)
    socketRef.current.emit('typing', {
      appealId,
      userId: operatorId,
      userType: 'operator',
      isTyping: false
    });
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!socketRef.current) return;

    // Отправка индикатора печати
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', {
        appealId,
        userId: operatorId,
        userType: 'operator',
        isTyping: true
      });
    }

    // Сброс таймера
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Через 2 секунды отправляем что перестали печатать
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current) {
        socketRef.current.emit('typing', {
          appealId,
          userId: operatorId,
          userType: 'operator',
          isTyping: false
        });
      }
    }, 2000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-5/6 flex flex-col">
        {/* Заголовок */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Чат по обращению</h3>
            <p className="text-sm opacity-90">ID: {appealId.substring(0, 8)}...</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm">{connected ? 'Подключено' : 'Отключено'}</span>
            <button
              onClick={onClose}
              className="ml-4 text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Область сообщений */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10">
              <p>Пока нет сообщений</p>
              <p className="text-sm mt-2">Начните диалог с гражданином</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`mb-4 flex ${msg.sender_type === 'operator' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender_type === 'operator'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow'
                }`}
              >
                <p className="text-sm font-semibold mb-1">
                  {msg.sender_type === 'operator' ? 'Вы (Оператор)' : 'Гражданин'}
                </p>
                <p className="break-words">{msg.message_text}</p>
                <p className={`text-xs mt-1 ${msg.sender_type === 'operator' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          ))}

          {/* Индикатор печати */}
          {citizenTyping && (
            <div className="mb-4 flex justify-start">
              <div className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow">
                <p className="text-sm">Гражданин печатает...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Форма ввода */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!connected}
            />
            <button
              type="submit"
              disabled={!connected || !newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
            >
              Отправить
            </button>
          </div>
          {isTyping && (
            <p className="text-xs text-gray-500 mt-2">Печатаете...</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

