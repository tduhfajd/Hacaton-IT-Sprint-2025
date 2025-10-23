import Queue from 'bull';
import { pool } from '../config/database';
import { GigaChatService } from '../services/GigaChatService';
import { AppealAnalysisModel } from '../models/AppealAnalysis';
import { logger } from '../utils/logger';

const REDIS_URL = process.env['REDIS_URL'] || 'redis://localhost:6379';

export interface AppealAnalysisJob {
  appealId: string;
  subject: string;
  description: string;
}

// Create queue
export const appealAnalysisQueue = new Queue<AppealAnalysisJob>('appeal-analysis', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: false
  }
});

// Worker processor
appealAnalysisQueue.process(async (job) => {
  const { appealId, subject, description } = job.data;
  
  logger.info('AI Worker: Starting analysis', { appealId, jobId: job.id });
  
  try {
    const analysisModel = new AppealAnalysisModel(pool);
    const gigaChatService = new GigaChatService(analysisModel);
    
    // Run AI analysis
    const analysisResult = await gigaChatService.analyzeAppeal(appealId, subject, description);
    
    if (!analysisResult.success) {
      throw new Error(`AI analysis failed: ${analysisResult.error}`);
    }
    
    logger.info('AI Worker: Analysis completed', { 
      appealId, 
      category: analysisResult.analysis?.category,
      priority: analysisResult.analysis?.priority,
      sentiment: analysisResult.analysis?.sentiment_type
    });
    
    // Generate suggested response based on KB
    const responseResult = await gigaChatService.generateResponse(
      appealId,
      `${subject}. ${description}`
    );
    
    if (responseResult.success) {
      logger.info('AI Worker: Response generated', { 
        appealId,
        hasResponse: !!responseResult.response
      });
    }
    
    // Update appeal with AI results (category, priority)
    if (analysisResult.analysis) {
      const categoryMap: Record<string, string> = {
        'Благоустройство': 'improvement',
        'Водоснабжение': 'water',
        'Теплоснабжение': 'heating',
        'Электроснабжение': 'electricity',
        'Мусор': 'garbage'
      };
      
      const priorityMap: Record<string, string> = {
        'high': 'high',
        'medium': 'medium',
        'low': 'low'
      };
      
      await pool.query(
        `UPDATE appeals 
         SET priority = $1, updated_at = NOW() 
         WHERE id = $2`,
        [priorityMap[analysisResult.analysis.priority] || 'medium', appealId]
      );
    }
    
    return { success: true, appealId, analysis: analysisResult.analysis };
    
  } catch (error: any) {
    logger.error('AI Worker: Analysis failed', { 
      appealId, 
      error: error.message,
      jobId: job.id
    });
    throw error; // Will trigger retry
  }
});

// Event handlers
appealAnalysisQueue.on('completed', (job, result) => {
  logger.info('AI Worker: Job completed', { jobId: job.id, appealId: result.appealId });
});

appealAnalysisQueue.on('failed', (job, err) => {
  logger.error('AI Worker: Job failed', { 
    jobId: job?.id, 
    appealId: job?.data?.appealId,
    error: err.message,
    attempts: job?.attemptsMade
  });
});

logger.info('Appeal Analysis Queue initialized', { redisUrl: REDIS_URL });

