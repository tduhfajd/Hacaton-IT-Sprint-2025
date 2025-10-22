import { Router } from 'express';
import { AIController } from '../controllers/AIController';
import { GigaChatService } from '../services/GigaChatService';
import { AppealModel } from '../models/Appeal';
import { AppealAnalysisModel } from '../models/AppealAnalysis';
import { AuthMiddleware } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { 
  appealIdValidator, 
  generateResponseValidators,
  searchKeywordsValidators 
} from '../validators/aiValidators';
import { db } from '../config/database';

// Initialize services
const userModel = new UserModel(db);
const authService = new AuthService(userModel);
const appealModel = new AppealModel(db);
const analysisModel = new AppealAnalysisModel(db);
const gigaChatService = new GigaChatService(analysisModel);
const aiController = new AIController(gigaChatService, appealModel, analysisModel);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Analyze appeal with AI
router.post('/analyze/:id', 
  appealIdValidator, 
  authMiddleware.requireRole(['operator', 'admin']),
  aiController.analyzeAppeal
);

// Generate AI response for appeal
router.post('/generate-response/:id', 
  appealIdValidator, 
  generateResponseValidators,
  authMiddleware.requireRole(['operator', 'admin']),
  aiController.generateResponse
);

// Get analysis for appeal
router.get('/analysis/:id', 
  appealIdValidator, 
  aiController.getAnalysis
);

// Get analysis statistics
router.get('/stats', 
  authMiddleware.requireRole(['operator', 'admin']),
  aiController.getAnalysisStats
);

// Search appeals by keywords
router.get('/search', 
  searchKeywordsValidators,
  authMiddleware.requireRole(['operator', 'admin']),
  aiController.searchByKeywords
);

// Test GigaChat connection
router.get('/test-connection', 
  authMiddleware.requireRole(['admin']),
  aiController.testConnection
);

export default router;