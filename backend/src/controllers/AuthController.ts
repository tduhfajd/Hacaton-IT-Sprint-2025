import { Request, Response } from 'express';
import { AuthService, LoginCredentials, RegisterData } from '../services/AuthService';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
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

      const userData: RegisterData = req.body;
      
      const result = await this.authService.register(userData);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      logger.error('Registration controller error', { 
        error: error.message, 
        body: req.body 
      });
      
      const statusCode = error.message.includes('already exists') ? 409 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
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

      const credentials: LoginCredentials = req.body;
      
      const result = await this.authService.login(credentials);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      logger.error('Login controller error', { 
        error: error.message, 
        email: req.body?.email 
      });
      
      const statusCode = error.message.includes('Invalid credentials') || 
                        error.message.includes('deactivated') ? 401 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });
    } catch (error) {
      logger.error('Token refresh controller error', { 
        error: error.message 
      });
      
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await this.authService.logout(req.user.userId);
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout controller error', { 
        error: error.message,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
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

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      
      await this.authService.changePassword(
        req.user.userId, 
        currentPassword, 
        newPassword
      );
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password controller error', { 
        error: error.message,
        userId: req.user?.userId 
      });
      
      const statusCode = error.message.includes('incorrect') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
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

      const { email } = req.body;
      
      await this.authService.resetPassword(email);
      
      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    } catch (error) {
      logger.error('Reset password controller error', { 
        error: error.message,
        email: req.body?.email 
      });
      
      res.status(500).json({
        success: false,
        message: 'Password reset request failed'
      });
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      logger.error('Get profile controller error', { 
        error: error.message,
        userId: req.user?.userId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  };
}