import { Router } from 'express';
import { AppealController } from '../controllers/AppealController';
import { AppealTrackingController } from '../controllers/AppealTrackingController';
import { AppealModel } from '../models/Appeal';
import { ResponseModel } from '../models/Response';
import { AppealAnalysisModel } from '../models/AppealAnalysis';
import { AppealTrackingService } from '../services/AppealTrackingService';
import { AuthMiddleware } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { 
  createAppealValidators, 
  updateAppealValidators, 
  appealIdValidator,
  trackingNumberValidator,
  appealQueryValidators 
} from '../validators/appealValidators';
import {
  changeStatusValidators,
  addResponseValidators,
  statusValidator,
  searchQueryValidators
} from '../validators/trackingValidators';
import { db } from '../config/database';

// Initialize services
const userModel = new UserModel(db);
const authService = new AuthService(userModel);
const appealModel = new AppealModel(db);
const responseModel = new ResponseModel(db);
const analysisModel = new AppealAnalysisModel(db);
const trackingService = new AppealTrackingService(appealModel, responseModel, analysisModel);

const appealController = new AppealController(appealModel);
const trackingController = new AppealTrackingController(trackingService);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

// Public routes
router.get('/tracking/:trackingNumber', trackingNumberValidator, appealController.getAppealByTrackingNumber);

// Protected routes
router.use(authMiddleware.verifyToken);

// Basic appeal operations
router.post('/', createAppealValidators, appealController.createAppeal);
router.get('/', appealQueryValidators, appealController.getAppeals);
router.get('/stats', appealController.getAppealStats);
router.get('/:id', appealIdValidator, appealController.getAppealById);
router.put('/:id', appealIdValidator, updateAppealValidators, appealController.updateAppeal);
router.delete('/:id', appealIdValidator, appealController.deleteAppeal);

// Tracking operations
router.get('/:id/tracking', appealIdValidator, trackingController.getTrackingInfo);
router.get('/:id/timeline', appealIdValidator, trackingController.getTimeline);
router.post('/:id/status', appealIdValidator, changeStatusValidators, trackingController.changeStatus);
router.post('/:id/responses', appealIdValidator, addResponseValidators, trackingController.addResponse);

// Search and filtering
router.get('/search', searchQueryValidators, trackingController.searchAppeals);
router.get('/status/:status', statusValidator, trackingController.getAppealsByStatus);

export default router;