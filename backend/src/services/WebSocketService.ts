import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { ChatService } from './ChatService';
import { ChatMessageModel } from '../models/ChatMessage';
import { ChatSessionModel } from '../models/ChatSession';
import { AppealModel } from '../models/Appeal';
import { UserModel } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

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

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // appealId -> Set of socketIds
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    httpServer: HTTPServer,
    private chatService: ChatService
  ) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userEmail = decoded.email;
        
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);

      // Join appeal room
      socket.on('join_appeal', async (appealId: string) => {
        try {
          // Verify user has access to this appeal
          const hasAccess = await this.verifyAppealAccess(appealId, socket.userId!, socket.userRole!);
          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to this appeal' });
            return;
          }

          socket.join(`appeal_${appealId}`);
          
          // Track user connection to appeal
          if (!this.connectedUsers.has(appealId)) {
            this.connectedUsers.set(appealId, new Set());
          }
          this.connectedUsers.get(appealId)!.add(socket.id);
          this.userSockets.set(socket.userId!, socket.id);

          socket.emit('joined_appeal', { appealId });
          console.log(`User ${socket.userId} joined appeal ${appealId}`);
        } catch (error) {
          console.error('Error joining appeal:', error);
          socket.emit('error', { message: 'Failed to join appeal' });
        }
      });

      // Leave appeal room
      socket.on('leave_appeal', (appealId: string) => {
        socket.leave(`appeal_${appealId}`);
        
        const appealUsers = this.connectedUsers.get(appealId);
        if (appealUsers) {
          appealUsers.delete(socket.id);
          if (appealUsers.size === 0) {
            this.connectedUsers.delete(appealId);
          }
        }
        
        socket.emit('left_appeal', { appealId });
        console.log(`User ${socket.userId} left appeal ${appealId}`);
      });

      // Send message
      socket.on('send_message', async (data: { appealId: string; message: string; messageType?: string; fileId?: string }) => {
        try {
          const { appealId, message, messageType, fileId } = data;

          // Verify access
          const hasAccess = await this.verifyAppealAccess(appealId, socket.userId!, socket.userRole!);
          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to this appeal' });
            return;
          }

          // Send message through chat service
          const result = await this.chatService.sendMessage(
            {
              appealId,
              userId: socket.userId!,
              userRole: socket.userRole!
            },
            {
              message,
              messageType: messageType as any,
              fileId
            }
          );

          if (result.success && result.message) {
            // Get full message details
            const fullMessage = await this.getFullMessageDetails(result.message.id);
            
            // Broadcast to all users in the appeal room
            this.io.to(`appeal_${appealId}`).emit('new_message', fullMessage);
            
            // Notify about unread count
            this.broadcastUnreadCount(appealId);
          } else {
            socket.emit('error', { message: result.error || 'Failed to send message' });
          }
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Mark messages as read
      socket.on('mark_read', async (appealId: string) => {
        try {
          const result = await this.chatService.markMessagesAsRead(appealId, socket.userId!);
          if (result.success) {
            this.broadcastUnreadCount(appealId);
          }
        } catch (error) {
          console.error('Error marking messages as read:', error);
        }
      });

      // Typing indicator
      socket.on('typing_start', (data: { appealId: string }) => {
        socket.to(`appeal_${data.appealId}`).emit('user_typing', {
          userId: socket.userId,
          userEmail: socket.userEmail,
          appealId: data.appealId
        });
      });

      socket.on('typing_stop', (data: { appealId: string }) => {
        socket.to(`appeal_${data.appealId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          appealId: data.appealId
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        
        // Remove from all appeal rooms
        for (const [appealId, users] of this.connectedUsers.entries()) {
          users.delete(socket.id);
          if (users.size === 0) {
            this.connectedUsers.delete(appealId);
          }
        }
        
        this.userSockets.delete(socket.userId!);
      });
    });
  }

  private async verifyAppealAccess(appealId: string, userId: string, userRole: string): Promise<boolean> {
    try {
      // This would typically check if user has access to the appeal
      // For now, we'll implement a basic check
      return true; // Simplified for now
    } catch (error) {
      console.error('Error verifying appeal access:', error);
      return false;
    }
  }

  private async getFullMessageDetails(messageId: string): Promise<ChatMessage | null> {
    try {
      const chatMessageModel = new ChatMessageModel(global.db);
      const messages = await chatMessageModel.findByAppealId('', 1, 0); // This needs to be fixed
      return messages[0] || null;
    } catch (error) {
      console.error('Error getting full message details:', error);
      return null;
    }
  }

  private async broadcastUnreadCount(appealId: string) {
    try {
      const chatMessageModel = new ChatMessageModel(global.db);
      const unreadCount = await chatMessageModel.getUnreadCount(appealId, '');
      
      this.io.to(`appeal_${appealId}`).emit('unread_count_update', {
        appealId,
        unreadCount
      });
    } catch (error) {
      console.error('Error broadcasting unread count:', error);
    }
  }

  // Public methods for external use
  public notifyNewMessage(appealId: string, message: ChatMessage) {
    this.io.to(`appeal_${appealId}`).emit('new_message', message);
    this.broadcastUnreadCount(appealId);
  }

  public notifySessionUpdate(appealId: string, sessionData: any) {
    this.io.to(`appeal_${appealId}`).emit('session_update', sessionData);
  }

  public notifyAppealStatusUpdate(appealId: string, status: string) {
    this.io.to(`appeal_${appealId}`).emit('appeal_status_update', {
      appealId,
      status
    });
  }

  public getConnectedUsers(appealId: string): string[] {
    const users = this.connectedUsers.get(appealId);
    return users ? Array.from(users) : [];
  }

  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}