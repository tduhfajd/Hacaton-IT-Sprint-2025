import { Request, Response } from 'express';
import { GigaChatService } from '../services/GigaChatService';
import { AppealModel } from '../models/Appeal';
import { AppealAnalysisModel } from '../models/AppealAnalysis';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';

export class AIController {
  constructor(
    private gigaChatService: GigaChatService,
    private appealModel: AppealModel,
    private analysisModel: AppealAnalysisModel
  ) {}

  analyzeAppeal = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      
      // Get appeal details
      const appeal = await this.appealModel.findById(id);
      if (!appeal) {
        res.status(404).json({
          success: false,
          message: 'Appeal not found'
        });
        return;
      }

      // Check if analysis already exists
      const existingAnalysis = await this.analysisModel.findByAppealId(id);
      if (existingAnalysis) {
        res.json({
          success: true,
          message: 'Analysis already exists',
          data: { analysis: existingAnalysis }
        });
        return;
      }

      // Perform AI analysis
      const result = await this.gigaChatService.analyzeAppeal(
        id,
        appeal.subject,
        appeal.description
      );

      if (!result.success) {
        res.status(500).json({
          success: false,
          message: 'Analysis failed',
          error: result.error
        });
        return;
      }

      logger.info(`AI analysis completed for appeal ${id}`, {
        appealId: id,
        analysisId: result.analysis?.id,
        sentiment: result.analysis?.sentiment_type,
        confidence: result.analysis?.ai_confidence
      });

      res.json({
        success: true,
        message: 'Analysis completed successfully',
        data: { analysis: result.analysis }
      });
    } catch (error) {
      logger.error('Analyze appeal controller error', { 
        error: error.message,
        appealId: req.params.id,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to analyze appeal'
      });
    }
  };

  generateResponse = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const { context } = req.body;

      if (!context || context.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'Context is required'
        });
        return;
      }

      // Get appeal details for context
      const appeal = await this.appealModel.findById(id);
      if (!appeal) {
        res.status(404).json({
          success: false,
          message: 'Appeal not found'
        });
        return;
      }

      // Build full context
      const fullContext = `
Обращение #${appeal.tracking_number}
Тема: ${appeal.subject}
Описание: ${appeal.description}
Дополнительный контекст: ${context}
      `.trim();

      // Generate AI response
      const result = await this.gigaChatService.generateResponse(id, fullContext);

      if (!result.success) {
        res.status(500).json({
          success: false,
          message: 'Response generation failed',
          error: result.error
        });
        return;
      }

      logger.info(`AI response generated for appeal ${id}`, {
        appealId: id,
        userId: req.user?.userId
      });

      res.json({
        success: true,
        message: 'Response generated successfully',
        data: { 
          response: result.response,
          is_ai_generated: true
        }
      });
    } catch (error) {
      logger.error('Generate response controller error', { 
        error: error.message,
        appealId: req.params.id,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate response'
      });
    }
  };

  getAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const analysis = await this.analysisModel.findByAppealId(id);
      
      if (!analysis) {
        res.status(404).json({
          success: false,
          message: 'Analysis not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { analysis }
      });
    } catch (error) {
      logger.error('Get analysis controller error', { 
        error: error.message,
        appealId: req.params.id 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get analysis'
      });
    }
  };

  getAnalysisStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only operators and admins can see analysis stats
      if (req.user?.role === 'citizen') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const stats = await this.analysisModel.getAnalysisStats();
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Get analysis stats controller error', { 
        error: error.message,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get analysis statistics'
      });
    }
  };

  searchByKeywords = async (req: Request, res: Response): Promise<void> => {
    try {
      const { keywords } = req.query;
      
      if (!keywords || typeof keywords !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Keywords parameter is required'
        });
        return;
      }

      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
      
      if (keywordArray.length === 0) {
        res.status(400).json({
          success: false,
          message: 'At least one keyword is required'
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const analyses = await this.analysisModel.searchByKeywords(keywordArray, limit, offset);
      
      res.json({
        success: true,
        data: { 
          analyses,
          pagination: {
            limit,
            offset,
            total: analyses.length
          }
        }
      });
    } catch (error) {
      logger.error('Search by keywords controller error', { 
        error: error.message,
        keywords: req.query.keywords 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to search by keywords'
      });
    }
  };

  testConnection = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only admins can test connection
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const result = await this.gigaChatService.testConnection();
      
      if (result.success) {
        res.json({
          success: true,
          message: 'GigaChat connection successful'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'GigaChat connection failed',
          error: result.error
        });
      }
    } catch (error) {
      logger.error('Test connection controller error', { 
        error: error.message,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to test connection'
      });
    }
  };
}