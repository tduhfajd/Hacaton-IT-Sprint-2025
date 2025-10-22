import { param, query } from 'express-validator';

export const fileIdValidator = [
  param('fileId')
    .isUUID()
    .withMessage('File ID must be a valid UUID')
];

export const appealIdValidator = [
  param('appealId')
    .isUUID()
    .withMessage('Appeal ID must be a valid UUID')
];

export const fileQueryValidators = [
  query('mime_type')
    .optional()
    .isString()
    .withMessage('MIME type must be a string'),
  
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),
  
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
];