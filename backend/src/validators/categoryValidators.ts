import { body, param } from 'express-validator';

export const createCategoryValidators = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
];

export const updateCategoryValidators = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

export const categoryIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID')
];