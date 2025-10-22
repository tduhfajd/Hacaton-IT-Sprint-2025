import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  appeal_id: string;
  sender_id: string;
  sender_type: 'citizen' | 'operator' | 'system';
  message: string;
  message_type: 'text' | 'file' | 'system';
  file_id?: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_email: string;
  file_name?: string;
  file_url?: string;
}

interface ChatHistory {
  messages: ChatMessage[];
  session: any;
  unreadCount: number;
  hasMore: boolean;
}

interface UseChatOptions {
  appealId: string;
  autoConnect?: boolean;
}

export const useChat = ({ appealId, autoConnect = true }: UseChatOptions) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState<{ [userId: string]: boolean }>({});
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('joined_appeal', (data) => {
      console.log('Joined appeal:', data.appealId);
    });

    newSocket.on('new_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('unread_count_update', (data) => {
      setUnreadCount(data.unreadCount);
    });

    newSocket.on('user_typing', (data) => {
      setIsTyping(prev => ({ ...prev, [data.userId]: true }));
    });

    newSocket.on('user_stopped_typing', (data) => {
      setIsTyping(prev => {
        const newTyping = { ...prev };
        delete newTyping[data.userId];
        return newTyping;
      });
    });

    newSocket.on('error', (error) => {
      console.error('Chat error:', error);
      toast.error(error.message || 'Chat connection error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [autoConnect]);

  // Join appeal room when connected
  useEffect(() => {
    if (socket && isConnected && appealId) {
      socket.emit('join_appeal', appealId);
    }
  }, [socket, isConnected, appealId]);

  // Load initial messages
  const loadMessages = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      const response = await apiService.get(`/chat/appeal/${appealId}/history`, {
        params: { limit: 50, offset: currentOffset }
      });

      if (response.data.success) {
        const history: ChatHistory = response.data.data;
        setMessages(prev => reset ? history.messages : [...history.messages, ...prev]);
        setUnreadCount(history.unreadCount);
        setHasMore(history.hasMore);
        setOffset(currentOffset + history.messages.length);
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [appealId, offset]);

  // Load initial messages on mount
  useEffect(() => {
    if (appealId) {
      loadMessages(true);
    }
  }, [appealId]);

  // Send message
  const sendMessage = useCallback(async (message: string, messageType: 'text' | 'file' | 'system' = 'text', fileId?: string) => {
    if (!socket || !isConnected) {
      toast.error('Not connected to chat');
      return;
    }

    try {
      socket.emit('send_message', {
        appealId,
        message,
        messageType,
        fileId
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [socket, isConnected, appealId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!socket || !isConnected) return;

    try {
      socket.emit('mark_read', appealId);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [socket, isConnected, appealId]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    socket.emit('typing_start', { appealId });
  }, [socket, isConnected, appealId]);

  const stopTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { appealId });
    }, 1000);
  }, [socket, isConnected, appealId]);

  // Load more messages
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadMessages(false);
    }
  }, [hasMore, isLoading, loadMessages]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    messages,
    unreadCount,
    isLoading,
    isTyping,
    hasMore,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    loadMore,
    disconnect,
    loadMessages
  };
};