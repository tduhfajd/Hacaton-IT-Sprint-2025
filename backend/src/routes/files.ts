import { Router } from 'express';
import { FileController } from '../controllers/FileController';
import { FileUploadService } from '../services/FileUploadService';
import { FileModel } from '../models/File';
import { AuthMiddleware } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { fileIdValidator } from '../validators/fileValidators';
import { db } from '../config/database';

// Initialize services
const userModel = new UserModel(db);
const authService = new AuthService(userModel);
const fileModel = new FileModel(db);
const fileUploadService = new FileUploadService(fileModel);
const fileController = new FileController(fileUploadService);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

// Get multer configuration
const upload = fileUploadService.getMulterConfig();

// Public routes (no auth required for file access)
router.get('/:fileId', fileIdValidator, fileController.getFile);
router.get('/:fileId/download', fileIdValidator, fileController.downloadFile);

// Protected routes
router.use(authMiddleware.verifyToken);

// Upload files to appeal
router.post('/appeal/:appealId', 
  upload.array('files', parseInt(process.env.MAX_FILES_PER_REQUEST || '5')),
  fileController.uploadFiles
);

// Get files by appeal
router.get('/appeal/:appealId', fileController.getFilesByAppeal);

// Delete file
router.delete('/:fileId', fileIdValidator, fileController.deleteFile);

// File statistics (operators and admins only)
router.get('/stats', authMiddleware.requireRole(['operator', 'admin']), fileController.getFileStats);

export default router;