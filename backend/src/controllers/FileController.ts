import { Request, Response } from 'express';
import { FileUploadService } from '../services/FileUploadService';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';
import path from 'path';

export class FileController {
  constructor(private fileUploadService: FileUploadService) {}

  uploadFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { appealId } = req.params;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
        return;
      }

      const result = await this.fileUploadService.uploadMultipleFiles(
        files,
        appealId,
        req.user.userId
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Files uploaded successfully',
          data: {
            files: result.files,
            errors: result.errors
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to upload files',
          errors: result.errors
        });
      }
    } catch (error) {
      logger.error('Upload files controller error', { 
        error: error.message,
        appealId: req.params.appealId,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to upload files'
      });
    }
  };

  getFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      
      const result = await this.fileUploadService.getFile(fileId);
      
      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.error
        });
        return;
      }

      const file = result.file;
      const filePath = path.join(process.env.UPLOAD_DIR || './uploads', file.file_path);
      
      // Set appropriate headers
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
      res.setHeader('Content-Length', file.file_size);
      
      // Stream the file
      const fileStream = this.fileUploadService.getFileStream(file.file_path);
      if (!fileStream) {
        res.status(404).json({
          success: false,
          message: 'File not found on disk'
        });
        return;
      }

      fileStream.pipe(res);
    } catch (error) {
      logger.error('Get file controller error', { 
        error: error.message,
        fileId: req.params.fileId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get file'
      });
    }
  };

  downloadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      
      const result = await this.fileUploadService.getFile(fileId);
      
      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.error
        });
        return;
      }

      const file = result.file;
      const filePath = path.join(process.env.UPLOAD_DIR || './uploads', file.file_path);
      
      // Set appropriate headers for download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Length', file.file_size);
      
      // Stream the file
      const fileStream = this.fileUploadService.getFileStream(file.file_path);
      if (!fileStream) {
        res.status(404).json({
          success: false,
          message: 'File not found on disk'
        });
        return;
      }

      fileStream.pipe(res);
    } catch (error) {
      logger.error('Download file controller error', { 
        error: error.message,
        fileId: req.params.fileId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to download file'
      });
    }
  };

  getFilesByAppeal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appealId } = req.params;
      
      const result = await this.fileUploadService.getFilesByAppeal(appealId);
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          message: result.error
        });
        return;
      }

      res.json({
        success: true,
        data: { files: result.files }
      });
    } catch (error) {
      logger.error('Get files by appeal controller error', { 
        error: error.message,
        appealId: req.params.appealId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get files'
      });
    }
  };

  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { fileId } = req.params;
      
      const result = await this.fileUploadService.deleteFile(fileId);
      
      if (!result.success) {
        res.status(404).json({
          success: false,
          message: result.error
        });
        return;
      }

      logger.info(`File deleted`, { 
        fileId,
        userId: req.user.userId 
      });
      
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      logger.error('Delete file controller error', { 
        error: error.message,
        fileId: req.params.fileId,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }
  };

  getFileStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only operators and admins can see file stats
      if (req.user?.role === 'citizen') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const result = await this.fileUploadService.getFileStats();
      
      if (!result.success) {
        res.status(500).json({
          success: false,
          message: result.error
        });
        return;
      }

      res.json({
        success: true,
        data: { stats: result.stats }
      });
    } catch (error) {
      logger.error('Get file stats controller error', { 
        error: error.message,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get file statistics'
      });
    }
  };
}