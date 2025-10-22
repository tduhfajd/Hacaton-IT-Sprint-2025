import { Request, Response } from 'express';
import { AppealModel, CreateAppealData, UpdateAppealData, AppealFilters } from '../models/Appeal';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';

export class AppealController {
  constructor(private appealModel: AppealModel) {}

  createAppeal = async (req: Request, res: Response): Promise<void> => {
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

      const appealData: CreateAppealData = {
        ...req.body,
        user_id: req.user?.userId || null
      };
      
      const appeal = await this.appealModel.create(appealData);
      
      logger.info(`Appeal created`, { 
        appealId: appeal.id, 
        trackingNumber: appeal.tracking_number,
        userId: req.user?.userId 
      });
      
      res.status(201).json({
        success: true,
        message: 'Appeal created successfully',
        data: {
          id: appeal.id,
          tracking_number: appeal.tracking_number,
          status: appeal.status,
          submitted_at: appeal.submitted_at
        }
      });
    } catch (error) {
      logger.error('Create appeal controller error', { 
        error: error.message, 
        body: req.body,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create appeal'
      });
    }
  };

  getAppeals = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: AppealFilters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        category_id: req.query.category_id as string,
        user_id: req.query.user_id as string,
        date_from: req.query.date_from as string,
        date_to: req.query.date_to as string,
        search: req.query.search as string
      };

      // If user is citizen, only show their appeals
      if (req.user?.role === 'citizen') {
        filters.user_id = req.user.userId;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const [appeals, total] = await Promise.all([
        this.appealModel.list(filters, limit, offset),
        this.appealModel.count(filters)
      ]);
      
      res.json({
        success: true,
        data: {
          appeals,
          pagination: {
            total,
            limit,
            offset,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get appeals controller error', { 
        error: error.message,
        query: req.query,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get appeals'
      });
    }
  };

  getAppealById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const appeal = await this.appealModel.findById(id);
      
      if (!appeal) {
        res.status(404).json({
          success: false,
          message: 'Appeal not found'
        });
        return;
      }

      // If user is citizen, only allow access to their own appeals
      if (req.user?.role === 'citizen' && appeal.user_id !== req.user.userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }
      
      res.json({
        success: true,
        data: { appeal }
      });
    } catch (error) {
      logger.error('Get appeal by ID controller error', { 
        error: error.message,
        appealId: req.params.id,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get appeal'
      });
    }
  };

  getAppealByTrackingNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const { trackingNumber } = req.params;
      
      const appeal = await this.appealModel.findByTrackingNumber(trackingNumber);
      
      if (!appeal) {
        res.status(404).json({
          success: false,
          message: 'Appeal not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: { appeal }
      });
    } catch (error) {
      logger.error('Get appeal by tracking number controller error', { 
        error: error.message,
        trackingNumber: req.params.trackingNumber 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get appeal'
      });
    }
  };

  updateAppeal = async (req: Request, res: Response): Promise<void> => {
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
      const updateData: UpdateAppealData = req.body;
      
      // Check if appeal exists
      const existingAppeal = await this.appealModel.findById(id);
      if (!existingAppeal) {
        res.status(404).json({
          success: false,
          message: 'Appeal not found'
        });
        return;
      }

      // If user is citizen, only allow updating their own appeals and only certain fields
      if (req.user?.role === 'citizen') {
        if (existingAppeal.user_id !== req.user.userId) {
          res.status(403).json({
            success: false,
            message: 'Access denied'
          });
          return;
        }

        // Citizens can only update subject, description, and address
        const allowedFields = ['subject', 'description', 'address'];
        const restrictedFields = Object.keys(updateData).filter(key => !allowedFields.includes(key));
        
        if (restrictedFields.length > 0) {
          res.status(400).json({
            success: false,
            message: `You can only update: ${allowedFields.join(', ')}`
          });
          return;
        }
      }
      
      const updatedAppeal = await this.appealModel.update(id, updateData);
      
      if (!updatedAppeal) {
        res.status(500).json({
          success: false,
          message: 'Failed to update appeal'
        });
        return;
      }
      
      logger.info(`Appeal updated`, { 
        appealId: id, 
        updatedFields: Object.keys(updateData),
        userId: req.user?.userId 
      });
      
      res.json({
        success: true,
        message: 'Appeal updated successfully',
        data: { appeal: updatedAppeal }
      });
    } catch (error) {
      logger.error('Update appeal controller error', { 
        error: error.message,
        appealId: req.params.id,
        body: req.body,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update appeal'
      });
    }
  };

  deleteAppeal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if appeal exists
      const existingAppeal = await this.appealModel.findById(id);
      if (!existingAppeal) {
        res.status(404).json({
          success: false,
          message: 'Appeal not found'
        });
        return;
      }

      // Only allow citizens to delete their own appeals, and only if status is 'new'
      if (req.user?.role === 'citizen') {
        if (existingAppeal.user_id !== req.user.userId) {
          res.status(403).json({
            success: false,
            message: 'Access denied'
          });
          return;
        }

        if (existingAppeal.status !== 'new') {
          res.status(400).json({
            success: false,
            message: 'Can only delete appeals with status "new"'
          });
          return;
        }
      }
      
      const deleted = await this.appealModel.delete(id);
      
      if (!deleted) {
        res.status(500).json({
          success: false,
          message: 'Failed to delete appeal'
        });
        return;
      }
      
      logger.info(`Appeal deleted`, { 
        appealId: id,
        userId: req.user?.userId 
      });
      
      res.json({
        success: true,
        message: 'Appeal deleted successfully'
      });
    } catch (error) {
      logger.error('Delete appeal controller error', { 
        error: error.message,
        appealId: req.params.id,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete appeal'
      });
    }
  };

  getAppealStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Only operators and admins can see stats
      if (req.user?.role === 'citizen') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const stats = await this.appealModel.getStats();
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Get appeal stats controller error', { 
        error: error.message,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get appeal statistics'
      });
    }
  };
}