import { body, param, query } from 'express-validator';

export const sendMessageValidators = [
  param('appealId').isUUID().withMessage('Appeal ID must be a valid UUID'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'system'])
    .withMessage('Message type must be text, file, or system'),
  body('fileId')
    .optional()
    .isUUID()
    .withMessage('File ID must be a valid UUID')
];

export const appealIdValidator = [
  param('appealId').isUUID().withMessage('Appeal ID must be a valid UUID')
];

export const sessionIdValidator = [
  param('sessionId').isUUID().withMessage('Session ID must be a valid UUID')
];

export const chatHistoryValidators = [
  param('appealId').isUUID().withMessage('Appeal ID must be a valid UUID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];