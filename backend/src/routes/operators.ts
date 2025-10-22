import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { CategoryModel } from '../models/Category';
import { AuthMiddleware } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { 
  createCategoryValidators, 
  updateCategoryValidators, 
  categoryIdValidator 
} from '../validators/categoryValidators';
import { db } from '../config/database';

// Initialize services
const userModel = new UserModel(db);
const authService = new AuthService(userModel);
const categoryModel = new CategoryModel(db);
const categoryController = new CategoryController(categoryModel);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

// All routes require authentication
router.use(authMiddleware.verifyToken);

// Category management (admin only)
router.post('/categories', authMiddleware.requireRole(['admin']), createCategoryValidators, categoryController.createCategory);
router.get('/categories', categoryController.getCategories);
router.get('/categories/:id', categoryIdValidator, categoryController.getCategoryById);
router.put('/categories/:id', authMiddleware.requireRole(['admin']), categoryIdValidator, updateCategoryValidators, categoryController.updateCategory);
router.delete('/categories/:id', authMiddleware.requireRole(['admin']), categoryIdValidator, categoryController.deleteCategory);

// Placeholder routes - will be implemented in later phases
router.get('/dashboard', (req, res) => {
  res.json({ message: 'Operator dashboard endpoint - to be implemented' });
});

router.get('/appeals', (req, res) => {
  res.json({ message: 'Get operator appeals endpoint - to be implemented' });
});

router.post('/appeals/:id/respond', (req, res) => {
  res.json({ message: `Respond to appeal ${req.params.id} endpoint - to be implemented` });
});

export default router;