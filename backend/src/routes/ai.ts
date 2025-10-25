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

// TEMPORARILY DISABLED: Authentication middleware for testing
// router.use(authMiddleware.verifyToken);

// Analyze appeal with AI (temporarily public for testing)
router.post('/analyze/:id', 
  appealIdValidator, 
  aiController.analyzeAppeal
);

// Generate AI response for appeal (temporarily public for testing)
router.post('/generate-response/:id', 
  appealIdValidator, 
  generateResponseValidators,
  aiController.generateResponse
);

// Get analysis for appeal
router.get('/analysis/:id', 
  appealIdValidator, 
  aiController.getAnalysis
);

// Get analysis statistics (temporarily public for testing)
router.get('/stats', 
  aiController.getAnalysisStats
);

// Search appeals by keywords (temporarily public for testing)
router.get('/search', 
  searchKeywordsValidators,
  aiController.searchByKeywords
);

// Test GigaChat connection (temporarily public for testing)
router.get('/test-connection', 
  aiController.testConnection
);

export default router;