import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FileModel, CreateFileData } from '../models/File';
import { logger } from '../utils/logger';

export class FileUploadService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedTypes: string[];

  constructor(private fileModel: FileModel) {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
    this.allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const fileName = this.fileModel.generateFileName(file.originalname);
        cb(null, fileName);
      }
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (this.allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} is not allowed`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: parseInt(process.env.MAX_FILES_PER_REQUEST || '5')
      }
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    appealId: string,
    uploadedBy: string
  ): Promise<{ success: boolean; file?: any; error?: string }> {
    try {
      // Validate file
      const validation = await this.fileModel.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create file record in database
      const fileData: CreateFileData = {
        appeal_id: appealId,
        original_name: file.originalname,
        file_name: file.filename,
        file_path: file.filename,
        file_size: file.size,
        mime_type: file.mimetype,
        uploaded_by: uploadedBy
      };

      const savedFile = await this.fileModel.create(fileData);

      logger.info('File uploaded successfully', {
        fileId: savedFile.id,
        appealId,
        originalName: file.originalname,
        fileName: file.filename,
        uploadedBy
      });

      return { success: true, file: savedFile };
    } catch (error) {
      logger.error('File upload error', {
        error: error.message,
        appealId,
        originalName: file.originalname,
        uploadedBy
      });

      // Clean up uploaded file if database save failed
      const filePath = path.join(this.uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return { success: false, error: 'Failed to save file information' };
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    appealId: string,
    uploadedBy: string
  ): Promise<{ success: boolean; files?: any[]; errors?: string[] }> {
    const results = [];
    const errors = [];

    for (const file of files) {
      const result = await this.uploadFile(file, appealId, uploadedBy);
      if (result.success) {
        results.push(result.file);
      } else {
        errors.push(`${file.originalname}: ${result.error}`);
      }
    }

    return {
      success: results.length > 0,
      files: results,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async getFile(fileId: string): Promise<{ success: boolean; file?: any; error?: string }> {
    try {
      const file = await this.fileModel.findById(fileId);
      if (!file) {
        return { success: false, error: 'File not found' };
      }

      const filePath = path.join(this.uploadDir, file.file_path);
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found on disk' };
      }

      return { success: true, file };
    } catch (error) {
      logger.error('Get file error', { error: error.message, fileId });
      return { success: false, error: 'Failed to get file' };
    }
  }

  async deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deleted = await this.fileModel.delete(fileId);
      if (!deleted) {
        return { success: false, error: 'File not found' };
      }

      logger.info('File deleted successfully', { fileId });
      return { success: true };
    } catch (error) {
      logger.error('Delete file error', { error: error.message, fileId });
      return { success: false, error: 'Failed to delete file' };
    }
  }

  async getFilesByAppeal(appealId: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const files = await this.fileModel.findByAppealId(appealId);
      return { success: true, files };
    } catch (error) {
      logger.error('Get files by appeal error', { error: error.message, appealId });
      return { success: false, error: 'Failed to get files' };
    }
  }

  async getFileStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const stats = await this.fileModel.getFileStats();
      return { success: true, stats };
    } catch (error) {
      logger.error('Get file stats error', { error: error.message });
      return { success: false, error: 'Failed to get file statistics' };
    }
  }

  getFileStream(filePath: string): fs.ReadStream | null {
    try {
      const fullPath = path.join(this.uploadDir, filePath);
      if (!fs.existsSync(fullPath)) {
        return null;
      }
      return fs.createReadStream(fullPath);
    } catch (error) {
      logger.error('Get file stream error', { error: error.message, filePath });
      return null;
    }
  }

  getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}