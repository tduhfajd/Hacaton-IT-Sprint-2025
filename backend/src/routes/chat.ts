import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { ChatService } from '../services/ChatService';
import { ChatMessageModel } from '../models/ChatMessage';
import { ChatSessionModel } from '../models/ChatSession';
import { AppealModel } from '../models/Appeal';
import { UserModel } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import { 
  sendMessageValidators, 
  appealIdValidator, 
  sessionIdValidator, 
  chatHistoryValidators 
} from '../validators/chatValidators';

const router = Router();

// Initialize models and services
const chatMessageModel = new ChatMessageModel(global.db);
const chatSessionModel = new ChatSessionModel(global.db);
const appealModel = new AppealModel(global.db);
const userModel = new UserModel(global.db);
const chatService = new ChatService(chatMessageModel, chatSessionModel, appealModel, userModel);
const chatController = new ChatController(chatService);

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Send message to appeal chat
router.post('/appeal/:appealId/message', 
  sendMessageValidators, 
  chatController.sendMessage
);

// Get chat history for an appeal
router.get('/appeal/:appealId/history', 
  chatHistoryValidators, 
  chatController.getChatHistory
);

// Mark messages as read
router.post('/appeal/:appealId/read', 
  appealIdValidator, 
  chatController.markAsRead
);

// Get active chat sessions (operators only)
router.get('/sessions/active', 
  authMiddleware.requireRole(['operator', 'admin']), 
  chatController.getActiveSessions
);

// Assign session to operator
router.post('/session/:sessionId/assign', 
  sessionIdValidator, 
  authMiddleware.requireRole(['operator', 'admin']), 
  chatController.assignSession
);

// Close chat session
router.post('/session/:sessionId/close', 
  sessionIdValidator, 
  authMiddleware.requireRole(['operator', 'admin']), 
  chatController.closeSession
);

// Get chat statistics (admin only)
router.get('/stats', 
  authMiddleware.requireRole(['admin']), 
  chatController.getStats
);

export default router;