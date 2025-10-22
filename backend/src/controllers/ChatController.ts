import { Request, Response } from 'express';
import { ChatService } from '../services/ChatService';
import { validationResult } from 'express-validator';

export class ChatController {
  constructor(private chatService: ChatService) {}

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { appealId } = req.params;
      const { message, messageType, fileId } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const context = {
        appealId,
        userId,
        userRole
      };

      const messageData = {
        message,
        messageType,
        fileId
      };

      const result = await this.chatService.sendMessage(context, messageData);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Message sent successfully',
          data: { message: result.message }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  getChatHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appealId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const result = await this.chatService.getChatHistory(
        appealId,
        userId,
        userRole,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      if (result.success) {
        res.json({
          success: true,
          data: result.history
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appealId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const result = await this.chatService.markMessagesAsRead(appealId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Messages marked as read',
          data: { markedCount: result.markedCount }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  getActiveSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Only operators and admins can see active sessions
      if (userRole !== 'operator' && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const operatorId = userRole === 'admin' ? undefined : userId;
      const result = await this.chatService.getActiveSessions(operatorId);

      if (result.success) {
        res.json({
          success: true,
          data: { sessions: result.sessions }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error in getActiveSessions:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  assignSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Only operators and admins can assign sessions
      if (userRole !== 'operator' && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const result = await this.chatService.assignSession(sessionId, userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Session assigned successfully',
          data: { session: result.session }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error in assignSession:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  closeSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      // Only operators and admins can close sessions
      if (userRole !== 'operator' && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const result = await this.chatService.closeSession(sessionId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Session closed successfully',
          data: { session: result.session }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error in closeSession:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userRole = req.user?.role;

      if (!userRole || userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const result = await this.chatService.getSessionStats();

      if (result.success) {
        res.json({
          success: true,
          data: { stats: result.stats }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}