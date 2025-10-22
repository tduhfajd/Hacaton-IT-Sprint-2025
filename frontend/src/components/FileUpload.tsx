import React, { useState, useRef } from 'react';
import { useAppeals } from '../hooks/useAppeals';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface FileUploadProps {
  appealId: string;
  onUploadComplete?: (files: any[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

interface UploadedFile {
  id: string;
  original_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  appealId,
  onUploadComplete,
  maxFiles = 5,
  maxSize = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `Файл "${file.name}" превышает максимальный размер ${maxSize}MB`;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return `Файл "${file.name}" имеет неподдерживаемый тип. Разрешены: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    // Check total file count
    if (files.length + fileArray.length > maxFiles) {
      newErrors.push(`Максимальное количество файлов: ${maxFiles}`);
      setErrors(newErrors);
      return;
    }

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setErrors([]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setErrors([]);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/files/appeal/${appealId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setUploadedFiles(prev => [...prev, ...data.data.files]);
        setFiles([]);
        onUploadComplete?.(data.data.files);
      } else {
        setErrors(data.errors || [data.message]);
      }
    } catch (error) {
      setErrors(['Ошибка загрузки файлов']);
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    } else if (mimeType === 'application/pdf') {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else if (mimeType === 'text/plain') {
      return '📄';
    }
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-primary-600 hover:text-primary-500 cursor-pointer">
                Нажмите для выбора файлов
              </span>{' '}
              или перетащите их сюда
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Максимум {maxFiles} файлов, до {maxSize}MB каждый
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Поддерживаемые форматы: JPG, PNG, GIF, PDF, DOC, DOCX, TXT
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Ошибки загрузки
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Выбранные файлы ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={uploadFiles}
            disabled={isUploading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Загрузка...' : `Загрузить ${files.length} файл(ов)`}
          </button>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Загруженные файлы ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.original_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.file_size)} • Загружен
                    </p>
                  </div>
                </div>
                <a
                  href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/files/${file.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  Скачать
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;