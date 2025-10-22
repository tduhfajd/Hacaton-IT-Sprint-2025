import { Request, Response } from 'express';
import { CategoryModel, CreateCategoryData, UpdateCategoryData } from '../models/Category';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';

export class CategoryController {
  constructor(private categoryModel: CategoryModel) {}

  createCategory = async (req: Request, res: Response): Promise<void> => {
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

      const categoryData: CreateCategoryData = req.body;
      
      // Check if category with same name already exists
      const existingCategory = await this.categoryModel.findByName(categoryData.name);
      if (existingCategory) {
        res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
        return;
      }
      
      const category = await this.categoryModel.create(categoryData);
      
      logger.info(`Category created`, { 
        categoryId: category.id, 
        categoryName: category.name,
        userId: req.user?.userId 
      });
      
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category }
      });
    } catch (error) {
      logger.error('Create category controller error', { 
        error: error.message, 
        body: req.body,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to create category'
      });
    }
  };

  getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const activeOnly = req.query.active_only !== 'false';
      
      const categories = await this.categoryModel.list(activeOnly);
      
      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      logger.error('Get categories controller error', { 
        error: error.message,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get categories'
      });
    }
  };

  getCategoryById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const category = await this.categoryModel.findById(id);
      
      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: { category }
      });
    } catch (error) {
      logger.error('Get category by ID controller error', { 
        error: error.message,
        categoryId: req.params.id,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get category'
      });
    }
  };

  updateCategory = async (req: Request, res: Response): Promise<void> => {
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
      const updateData: UpdateCategoryData = req.body;
      
      // Check if category exists
      const existingCategory = await this.categoryModel.findById(id);
      if (!existingCategory) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }

      // If updating name, check if another category with same name exists
      if (updateData.name && updateData.name !== existingCategory.name) {
        const duplicateCategory = await this.categoryModel.findByName(updateData.name);
        if (duplicateCategory) {
          res.status(409).json({
            success: false,
            message: 'Category with this name already exists'
          });
          return;
        }
      }
      
      const updatedCategory = await this.categoryModel.update(id, updateData);
      
      if (!updatedCategory) {
        res.status(500).json({
          success: false,
          message: 'Failed to update category'
        });
        return;
      }
      
      logger.info(`Category updated`, { 
        categoryId: id, 
        updatedFields: Object.keys(updateData),
        userId: req.user?.userId 
      });
      
      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category: updatedCategory }
      });
    } catch (error) {
      logger.error('Update category controller error', { 
        error: error.message,
        categoryId: req.params.id,
        body: req.body,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to update category'
      });
    }
  };

  deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if category exists
      const existingCategory = await this.categoryModel.findById(id);
      if (!existingCategory) {
        res.status(404).json({
          success: false,
          message: 'Category not found'
        });
        return;
      }
      
      const deleted = await this.categoryModel.delete(id);
      
      if (!deleted) {
        res.status(500).json({
          success: false,
          message: 'Failed to delete category'
        });
        return;
      }
      
      logger.info(`Category deleted`, { 
        categoryId: id,
        categoryName: existingCategory.name,
        userId: req.user?.userId 
      });
      
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      logger.error('Delete category controller error', { 
        error: error.message,
        categoryId: req.params.id,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete category'
      });
    }
  };
}