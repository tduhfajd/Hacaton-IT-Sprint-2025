import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { AuthMiddleware } from '../middleware/auth';
import { 
  registerValidators, 
  loginValidators, 
  changePasswordValidators, 
  resetPasswordValidators,
  refreshTokenValidators 
} from '../validators/authValidators';
import { db } from '../config/database';

// Initialize services
const userModel = new UserModel(db);
const authService = new AuthService(userModel);
const authController = new AuthController(authService);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

// Public routes
router.post('/register', registerValidators, authController.register);
router.post('/login', loginValidators, authController.login);
router.post('/refresh-token', refreshTokenValidators, authController.refreshToken);
router.post('/reset-password', resetPasswordValidators, authController.resetPassword);

// Protected routes
router.use(authMiddleware.verifyToken);

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.post('/change-password', changePasswordValidators, authController.changePassword);

export default router;