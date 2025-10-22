import { ChatMessageModel, ChatMessage, CreateChatMessageData, ChatMessageWithSender } from '../models/ChatMessage';
import { ChatSessionModel, ChatSession, CreateChatSessionData, ChatSessionWithDetails } from '../models/ChatSession';
import { AppealModel } from '../models/Appeal';
import { UserModel } from '../models/User';

export interface ChatContext {
  appealId: string;
  userId: string;
  userRole: string;
}

export interface SendMessageData {
  message: string;
  messageType?: 'text' | 'file' | 'system';
  fileId?: string;
}

export interface ChatHistory {
  messages: ChatMessageWithSender[];
  session: ChatSession | null;
  unreadCount: number;
  hasMore: boolean;
}

export class ChatService {
  constructor(
    private chatMessageModel: ChatMessageModel,
    private chatSessionModel: ChatSessionModel,
    private appealModel: AppealModel,
    private userModel: UserModel
  ) {}

  async sendMessage(context: ChatContext, messageData: SendMessageData): Promise<{
    success: boolean;
    message?: ChatMessage;
    error?: string;
  }> {
    try {
      // Verify appeal exists and user has access
      const appeal = await this.appealModel.findById(context.appealId);
      if (!appeal) {
        return { success: false, error: 'Appeal not found' };
      }

      // Check if user has access to this appeal
      if (context.userRole !== 'admin' && context.userRole !== 'operator' && appeal.user_id !== context.userId) {
        return { success: false, error: 'Access denied' };
      }

      // Create or get active session
      let session = await this.chatSessionModel.findByAppealId(context.appealId);
      if (!session) {
        const sessionData: CreateChatSessionData = {
          appeal_id: context.appealId,
          operator_id: context.userRole === 'operator' || context.userRole === 'admin' ? context.userId : undefined
        };
        session = await this.chatSessionModel.create(sessionData);
      } else if (session.status !== 'active') {
        // Reactivate session if it was closed
        await this.chatSessionModel.updateStatus(session.id, 'active', context.userId);
      }

      // Determine sender type
      const senderType = this.getSenderType(context.userRole);

      // Create message
      const messageDataToCreate: CreateChatMessageData = {
        appeal_id: context.appealId,
        sender_id: context.userId,
        sender_type: senderType,
        message: messageData.message,
        message_type: messageData.messageType || 'text',
        file_id: messageData.fileId
      };

      const message = await this.chatMessageModel.create(messageDataToCreate);

      // Update appeal status if needed
      if (context.userRole === 'operator' || context.userRole === 'admin') {
        await this.appealModel.update(context.appealId, { status: 'processing' });
      }

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: 'Failed to send message' };
    }
  }

  async getChatHistory(appealId: string, userId: string, userRole: string, limit = 50, offset = 0): Promise<{
    success: boolean;
    history?: ChatHistory;
    error?: string;
  }> {
    try {
      // Verify access
      const appeal = await this.appealModel.findById(appealId);
      if (!appeal) {
        return { success: false, error: 'Appeal not found' };
      }

      if (userRole !== 'admin' && userRole !== 'operator' && appeal.user_id !== userId) {
        return { success: false, error: 'Access denied' };
      }

      // Get messages
      const messages = await this.chatMessageModel.findByAppealId(appealId, limit + 1, offset);
      const hasMore = messages.length > limit;
      const messagesToReturn = hasMore ? messages.slice(0, limit) : messages;

      // Get session
      const session = await this.chatSessionModel.findByAppealId(appealId);

      // Get unread count
      const unreadCount = await this.chatMessageModel.getUnreadCount(appealId, userId);

      const history: ChatHistory = {
        messages: messagesToReturn,
        session,
        unreadCount,
        hasMore
      };

      return { success: true, history };
    } catch (error) {
      console.error('Error getting chat history:', error);
      return { success: false, error: 'Failed to get chat history' };
    }
  }

  async markMessagesAsRead(appealId: string, userId: string): Promise<{
    success: boolean;
    markedCount?: number;
    error?: string;
  }> {
    try {
      const markedCount = await this.chatMessageModel.markAllAsRead(appealId, userId);
      return { success: true, markedCount };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { success: false, error: 'Failed to mark messages as read' };
    }
  }

  async getActiveSessions(operatorId?: string): Promise<{
    success: boolean;
    sessions?: ChatSessionWithDetails[];
    error?: string;
  }> {
    try {
      let sessions: ChatSessionWithDetails[];
      
      if (operatorId) {
        sessions = await this.chatSessionModel.findByOperatorId(operatorId, 'active');
      } else {
        sessions = await this.chatSessionModel.findActiveSessions();
      }

      return { success: true, sessions };
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return { success: false, error: 'Failed to get active sessions' };
    }
  }

  async assignSession(sessionId: string, operatorId: string): Promise<{
    success: boolean;
    session?: ChatSession;
    error?: string;
  }> {
    try {
      const session = await this.chatSessionModel.assignOperator(sessionId, operatorId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      return { success: true, session };
    } catch (error) {
      console.error('Error assigning session:', error);
      return { success: false, error: 'Failed to assign session' };
    }
  }

  async closeSession(sessionId: string): Promise<{
    success: boolean;
    session?: ChatSession;
    error?: string;
  }> {
    try {
      const session = await this.chatSessionModel.closeSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      return { success: true, session };
    } catch (error) {
      console.error('Error closing session:', error);
      return { success: false, error: 'Failed to close session' };
    }
  }

  async getSessionStats(): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const [sessionStats, messageStats] = await Promise.all([
        this.chatSessionModel.getSessionStats(),
        this.chatMessageModel.getMessageStats()
      ]);

      const stats = {
        sessions: sessionStats,
        messages: messageStats
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return { success: false, error: 'Failed to get session stats' };
    }
  }

  private getSenderType(userRole: string): 'citizen' | 'operator' | 'system' {
    switch (userRole) {
      case 'admin':
      case 'operator':
        return 'operator';
      case 'citizen':
        return 'citizen';
      default:
        return 'system';
    }
  }
}