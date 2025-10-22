import { body, param, query } from 'express-validator';

export const changeStatusValidators = [
  body('new_status')
    .isIn(['new', 'processing', 'completed', 'rejected'])
    .withMessage('Status must be one of: new, processing, completed, rejected'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters')
];

export const addResponseValidators = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters'),
  
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean value'),
  
  body('is_ai_generated')
    .optional()
    .isBoolean()
    .withMessage('is_ai_generated must be a boolean value')
];

export const appealIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Appeal ID must be a valid UUID')
];

export const operatorIdValidator = [
  param('operatorId')
    .isUUID()
    .withMessage('Operator ID must be a valid UUID')
];

export const statusValidator = [
  param('status')
    .isIn(['new', 'processing', 'completed', 'rejected'])
    .withMessage('Status must be one of: new, processing, completed, rejected')
];

export const searchQueryValidators = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  query('status')
    .optional()
    .isIn(['new', 'processing', 'completed', 'rejected'])
    .withMessage('Status must be one of: new, processing, completed, rejected'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  
  query('category_id')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];

export const dateRangeValidators = [
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date')
];