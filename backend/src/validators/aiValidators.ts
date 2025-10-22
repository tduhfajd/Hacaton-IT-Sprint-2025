import { body, param, query } from 'express-validator';

export const appealIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Appeal ID must be a valid UUID')
];

export const generateResponseValidators = [
  body('context')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Context must be between 10 and 2000 characters')
];

export const searchKeywordsValidators = [
  query('keywords')
    .notEmpty()
    .withMessage('Keywords parameter is required')
    .isString()
    .withMessage('Keywords must be a string'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];