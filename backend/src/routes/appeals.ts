import { Router, Request, Response } from 'express';
import { AppealController } from '../controllers/AppealController';
import { AppealTrackingController } from '../controllers/AppealTrackingController';
import { AppealModel } from '../models/Appeal';
import { ResponseModel } from '../models/Response';
import { AppealAnalysisModel } from '../models/AppealAnalysis';
import { AppealTrackingService } from '../services/AppealTrackingService';
import { AuthMiddleware } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { 
  createAppealValidators, 
  updateAppealValidators, 
  appealIdValidator,
  trackingNumberValidator,
  appealQueryValidators 
} from '../validators/appealValidators';
import {
  changeStatusValidators,
  addResponseValidators,
  statusValidator,
  searchQueryValidators
} from '../validators/trackingValidators';
import { db, pool } from '../config/database';
import telegramBotService from '../services/TelegramBotService';

// Initialize services
const userModel = new UserModel(db);
const authService = new AuthService(userModel);
const appealModel = new AppealModel(db);
const responseModel = new ResponseModel(db);
const analysisModel = new AppealAnalysisModel(db);
const trackingService = new AppealTrackingService(appealModel, responseModel, analysisModel);

const appealController = new AppealController(appealModel);
const trackingController = new AppealTrackingController(trackingService);
const authMiddleware = new AuthMiddleware(authService);

const router = Router();

// Public routes
router.get('/tracking/:trackingNumber', trackingNumberValidator, appealController.getAppealByTrackingNumber);

// TEMPORARILY DISABLED: Authentication middleware
// router.use(authMiddleware.verifyToken);

// Basic appeal operations (temporarily public for testing)
router.post('/', createAppealValidators, appealController.createAppeal);
// Simple list alias to avoid legacy inline route conflicts (must be before :id)
router.get('/list', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, tracking_number, subject, description, status, priority,
        submitted_at, created_at, updated_at, address, user_id, category_id
      FROM appeals
      ORDER BY submitted_at DESC
      LIMIT 50
    `);
    res.json({ success: true, data: { appeals: result.rows } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to get appeals' });
  }
});
router.get('/', appealQueryValidators, appealController.getAppeals);
router.get('/stats', appealController.getAppealStats);
router.get('/:id', appealIdValidator, appealController.getAppealById);
router.put('/:id', appealIdValidator, updateAppealValidators, appealController.updateAppeal);
router.patch('/:id', appealIdValidator, updateAppealValidators, appealController.updateAppeal);
router.delete('/:id', appealIdValidator, appealController.deleteAppeal);

// AI Response endpoint (public for operators)
router.get('/:id/ai-response', appealIdValidator, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ar.suggested_text, ar.confidence, ar.sources, ar.created_at
       FROM ai_responses ar
       WHERE ar.appeal_id = $1
       ORDER BY ar.created_at DESC
       LIMIT 1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'No AI response available yet'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('AI Response API Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response',
      error: error.message
    });
  }
});

// Operator response endpoint (with Telegram integration)
router.post('/:id/operator-respond', appealIdValidator, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, operator_name } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get appeal info
    const appealResult = await pool.query(
      `SELECT source, telegram_chat_id, user_name FROM appeals WHERE id = $1`,
      [id]
    );

    if (appealResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appeal not found'
      });
    }

    const appeal = appealResult.rows[0];

    // Save message to chat_messages
    const operatorName = operator_name || 'Оператор';
    const responseMessage = `${operatorName}: ${message}`;

    await pool.query(
      `INSERT INTO chat_messages (appeal_id, sender_id, sender_type, message, created_at)
       VALUES ($1, (SELECT id FROM users WHERE role = 'operator' LIMIT 1), 'operator', $2, NOW())`,
      [id, responseMessage]
    );

    // If source is telegram, send to Telegram
    if (appeal.source === 'telegram' && appeal.telegram_chat_id) {
      try {
        await telegramBotService.sendMessage(appeal.telegram_chat_id, message);
        console.log(`✅ Message sent to Telegram for appeal ${id}`);
      } catch (telegramError: any) {
        console.error('❌ Failed to send to Telegram:', telegramError.message);
        // Continue anyway - message is saved in DB
      }
    }

    // Update appeal status to 'in_progress' if it's 'new'
    await pool.query(
      `UPDATE appeals SET status = 'in_progress', updated_at = NOW() WHERE id = $1 AND status = 'new'`,
      [id]
    );

    res.json({
      success: true,
      message: 'Response sent successfully',
      data: {
        sent_to_telegram: appeal.source === 'telegram' && !!appeal.telegram_chat_id
      }
    });
  } catch (error: any) {
    console.error('Operator Response Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send response',
      error: error.message
    });
  }
});

// Tracking operations
router.get('/:id/tracking', appealIdValidator, trackingController.getTrackingInfo);
router.get('/:id/timeline', appealIdValidator, trackingController.getTimeline);
router.post('/:id/status', appealIdValidator, changeStatusValidators, trackingController.changeStatus);
router.post('/:id/responses', appealIdValidator, addResponseValidators, trackingController.addResponse);

// Search and filtering
router.get('/search', searchQueryValidators, trackingController.searchAppeals);
router.get('/status/:status', statusValidator, trackingController.getAppealsByStatus);

export default router;