import { AppealModel, Appeal } from '../models/Appeal';
import { ResponseModel, Response } from '../models/Response';
import { AppealAnalysisModel, AppealAnalysis } from '../models/AppealAnalysis';
import { logger } from '../utils/logger';

export interface AppealTrackingInfo {
  appeal: Appeal;
  responses: Response[];
  analysis?: AppealAnalysis;
  status_history: Array<{
    status: string;
    changed_at: Date;
    changed_by?: string;
  }>;
  timeline: Array<{
    type: 'status_change' | 'response' | 'analysis';
    timestamp: Date;
    description: string;
    details?: any;
  }>;
}

export interface StatusChangeData {
  appeal_id: string;
  new_status: 'new' | 'processing' | 'completed' | 'rejected';
  operator_id: string;
  comment?: string;
}

export class AppealTrackingService {
  constructor(
    private appealModel: AppealModel,
    private responseModel: ResponseModel,
    private analysisModel: AppealAnalysisModel
  ) {}

  async getTrackingInfo(appealId: string, includeInternal = false): Promise<AppealTrackingInfo | null> {
    try {
      // Get appeal
      const appeal = await this.appealModel.findById(appealId);
      if (!appeal) {
        return null;
      }

      // Get responses
      const responses = await this.responseModel.findByAppealId(appealId, includeInternal);

      // Get analysis
      const analysis = await this.analysisModel.findByAppealId(appealId);

      // Build status history (simplified - in real implementation, you'd have a status_history table)
      const status_history = [
        {
          status: appeal.status,
          changed_at: appeal.updated_at,
          changed_by: undefined
        }
      ];

      // Build timeline
      const timeline = [];

      // Add appeal creation
      timeline.push({
        type: 'status_change' as const,
        timestamp: appeal.submitted_at,
        description: 'Обращение создано',
        details: { status: 'new' }
      });

      // Add status changes
      if (appeal.processed_at) {
        timeline.push({
          type: 'status_change' as const,
          timestamp: appeal.processed_at,
          description: 'Обращение взято в обработку',
          details: { status: 'processing' }
        });
      }

      if (appeal.completed_at) {
        timeline.push({
          type: 'status_change' as const,
          timestamp: appeal.completed_at,
          description: `Обращение ${appeal.status === 'completed' ? 'завершено' : 'отклонено'}`,
          details: { status: appeal.status }
        });
      }

      // Add responses
      responses.forEach(response => {
        timeline.push({
          type: 'response' as const,
          timestamp: response.created_at,
          description: `Ответ оператора${response.is_ai_generated ? ' (сгенерирован ИИ)' : ''}`,
          details: { 
            response_id: response.id,
            operator_id: response.operator_id,
            is_ai_generated: response.is_ai_generated
          }
        });
      });

      // Add analysis
      if (analysis) {
        timeline.push({
          type: 'analysis' as const,
          timestamp: analysis.created_at,
          description: 'Проведен анализ обращения',
          details: {
            sentiment: analysis.sentiment_type,
            confidence: analysis.ai_confidence,
            keywords: analysis.keywords
          }
        });
      }

      // Sort timeline by timestamp
      timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return {
        appeal,
        responses,
        analysis,
        status_history,
        timeline
      };
    } catch (error) {
      logger.error('Error getting tracking info', { error: error.message, appealId });
      throw error;
    }
  }

  async changeStatus(data: StatusChangeData): Promise<Appeal | null> {
    try {
      const { appeal_id, new_status, operator_id, comment } = data;

      // Get current appeal
      const currentAppeal = await this.appealModel.findById(appeal_id);
      if (!currentAppeal) {
        throw new Error('Appeal not found');
      }

      // Prepare update data
      const updateData: any = { status: new_status };

      // Set timestamps based on status
      if (new_status === 'processing' && currentAppeal.status === 'new') {
        updateData.processed_at = new Date();
      } else if ((new_status === 'completed' || new_status === 'rejected') && currentAppeal.status !== 'completed' && currentAppeal.status !== 'rejected') {
        updateData.completed_at = new Date();
      }

      // Update appeal
      const updatedAppeal = await this.appealModel.update(appeal_id, updateData);

      // Create internal response if comment provided
      if (comment) {
        await this.responseModel.create({
          appeal_id,
          operator_id,
          message: comment,
          response_type: 'internal',
          is_ai_generated: false
        });
      }

      logger.info('Appeal status changed', {
        appealId: appeal_id,
        oldStatus: currentAppeal.status,
        newStatus: new_status,
        operatorId: operator_id
      });

      return updatedAppeal;
    } catch (error) {
      logger.error('Error changing appeal status', { error: error.message, data });
      throw error;
    }
  }

  async addResponse(appealId: string, operatorId: string, message: string, isPublic = true, isAiGenerated = false): Promise<Response> {
    try {
      const response = await this.responseModel.create({
        appeal_id: appealId,
        operator_id: operatorId,
        message,
        response_type: isPublic ? 'public' : 'internal',
        is_ai_generated: isAiGenerated
      });

      logger.info('Response added to appeal', {
        appealId,
        responseId: response.id,
        operatorId,
        isPublic,
        isAiGenerated
      });

      return response;
    } catch (error) {
      logger.error('Error adding response', { error: error.message, appealId, operatorId });
      throw error;
    }
  }

  async getAppealTimeline(appealId: string): Promise<AppealTrackingInfo['timeline']> {
    try {
      const trackingInfo = await this.getTrackingInfo(appealId, true);
      return trackingInfo?.timeline || [];
    } catch (error) {
      logger.error('Error getting appeal timeline', { error: error.message, appealId });
      throw error;
    }
  }

  async getAppealsByStatus(status: string, limit = 50, offset = 0): Promise<{
    appeals: Appeal[];
    total: number;
  }> {
    try {
      const appeals = await this.appealModel.list({ status }, limit, offset);
      const total = await this.appealModel.count({ status });

      return { appeals, total };
    } catch (error) {
      logger.error('Error getting appeals by status', { error: error.message, status });
      throw error;
    }
  }

  async getOperatorStats(operatorId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    total_appeals: number;
    responses_count: number;
    avg_response_time: number;
    completed_appeals: number;
    rejected_appeals: number;
  }> {
    try {
      // This would require more complex queries in a real implementation
      // For now, return basic stats
      const appeals = await this.appealModel.list({}, 1000, 0);
      const responses = await this.responseModel.getResponseStats(operatorId);

      const operatorAppeals = appeals.filter(appeal => 
        // In real implementation, you'd track which operator handled which appeal
        true // Placeholder
      );

      return {
        total_appeals: operatorAppeals.length,
        responses_count: responses.total,
        avg_response_time: 0, // Would calculate from response times
        completed_appeals: operatorAppeals.filter(a => a.status === 'completed').length,
        rejected_appeals: operatorAppeals.filter(a => a.status === 'rejected').length
      };
    } catch (error) {
      logger.error('Error getting operator stats', { error: error.message, operatorId });
      throw error;
    }
  }

  async searchAppeals(query: string, filters: any = {}): Promise<Appeal[]> {
    try {
      return await this.appealModel.list({
        ...filters,
        search: query
      });
    } catch (error) {
      logger.error('Error searching appeals', { error: error.message, query, filters });
      throw error;
    }
  }
}