import { Request, Response } from 'express';
import { AppealTrackingService } from '../services/AppealTrackingService';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';

export class AppealTrackingController {
  constructor(private trackingService: AppealTrackingService) {}

  getTrackingInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const includeInternal = req.query.include_internal === 'true';
      
      const trackingInfo = await this.trackingService.getTrackingInfo(id, includeInternal);
      
      if (!trackingInfo) {
        res.status(404).json({
          success: false,
          message: 'Appeal not found'
        });
        return;
      }

      // If user is citizen, only show public responses
      if (req.user?.role === 'citizen') {
        trackingInfo.responses = trackingInfo.responses.filter(r => r.response_type === 'public');
        trackingInfo.timeline = trackingInfo.timeline.filter(t => 
          t.type !== 'response' || trackingInfo.responses.some(r => r.id === t.details?.response_id)
        );
      }
      
      res.json({
        success: true,
        data: { trackingInfo }
      });
    } catch (error) {
      logger.error('Get tracking info controller error', { 
        error: error.message,
        appealId: req.params.id,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get tracking information'
      });
    }
  };

  changeStatus = async (req: Request, res: Response): Promise<void> => {
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
      const { new_status, comment } = req.body;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const updatedAppeal = await this.trackingService.changeStatus({
        appeal_id: id,
        new_status,
        operator_id: req.user.userId,
        comment
      });
      
      if (!updatedAppeal) {
        res.status(404).json({
          success: false,
          message: 'Appeal not found'
        });
        return;
      }
      
      logger.info(`Appeal status changed`, { 
        appealId: id, 
        newStatus: new_status,
        operatorId: req.user.userId 
      });
      
      res.json({
        success: true,
        message: 'Status changed successfully',
        data: { appeal: updatedAppeal }
      });
    } catch (error) {
      logger.error('Change status controller error', { 
        error: error.message,
        appealId: req.params.id,
        body: req.body,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to change status'
      });
    }
  };

  addResponse = async (req: Request, res: Response): Promise<void> => {
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
      const { message, is_public = true, is_ai_generated = false } = req.body;
      
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const response = await this.trackingService.addResponse(
        id,
        req.user.userId,
        message,
        is_public,
        is_ai_generated
      );
      
      logger.info(`Response added to appeal`, { 
        appealId: id, 
        responseId: response.id,
        operatorId: req.user.userId 
      });
      
      res.status(201).json({
        success: true,
        message: 'Response added successfully',
        data: { response }
      });
    } catch (error) {
      logger.error('Add response controller error', { 
        error: error.message,
        appealId: req.params.id,
        body: req.body,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to add response'
      });
    }
  };

  getTimeline = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const timeline = await this.trackingService.getAppealTimeline(id);
      
      res.json({
        success: true,
        data: { timeline }
      });
    } catch (error) {
      logger.error('Get timeline controller error', { 
        error: error.message,
        appealId: req.params.id,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get timeline'
      });
    }
  };

  getAppealsByStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await this.trackingService.getAppealsByStatus(status, limit, offset);
      
      res.json({
        success: true,
        data: {
          appeals: result.appeals,
          pagination: {
            total: result.total,
            limit,
            offset,
            pages: Math.ceil(result.total / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get appeals by status controller error', { 
        error: error.message,
        status: req.params.status,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get appeals by status'
      });
    }
  };

  searchAppeals = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q } = req.query;
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        category_id: req.query.category_id as string,
        user_id: req.user?.role === 'citizen' ? req.user.userId : req.query.user_id as string
      };
      
      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }
      
      const appeals = await this.trackingService.searchAppeals(q as string, filters);
      
      res.json({
        success: true,
        data: { appeals }
      });
    } catch (error) {
      logger.error('Search appeals controller error', { 
        error: error.message,
        query: req.query,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to search appeals'
      });
    }
  };

  getOperatorStats = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { operatorId } = req.params;
      const dateFrom = req.query.date_from ? new Date(req.query.date_from as string) : undefined;
      const dateTo = req.query.date_to ? new Date(req.query.date_to as string) : undefined;
      
      // Only allow operators to see their own stats or admins to see any stats
      if (req.user.role !== 'admin' && req.user.userId !== operatorId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }
      
      const stats = await this.trackingService.getOperatorStats(operatorId, dateFrom, dateTo);
      
      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      logger.error('Get operator stats controller error', { 
        error: error.message,
        operatorId: req.params.operatorId,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get operator statistics'
      });
    }
  };
}