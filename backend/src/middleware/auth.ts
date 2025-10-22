import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  // Middleware to verify access token
  verifyToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Access token required'
        });
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        const payload = this.authService.verifyAccessToken(token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        };
        
        next();
      } catch (error) {
        logger.warn('Invalid access token', { 
          error: error.message, 
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        res.status(401).json({
          success: false,
          message: 'Invalid or expired access token'
        });
      }
    } catch (error) {
      logger.error('Auth middleware error', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };

  // Middleware to check if user has required role
  requireRole = (roles: string | string[]) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Insufficient permissions', { 
          userId: req.user.userId,
          userRole: req.user.role,
          requiredRoles: allowedRoles
        });
        
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    };
  };

  // Middleware to check if user is active
  requireActiveUser = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // This would typically check the user's active status from the database
    // For now, we'll assume the token verification is sufficient
    next();
  };

  // Optional authentication - doesn't fail if no token
  optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);
      
      try {
        const payload = this.authService.verifyAccessToken(token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        };
      } catch (error) {
        // Silently ignore invalid tokens for optional auth
        logger.debug('Optional auth failed', { error: error.message });
      }
      
      next();
    } catch (error) {
      logger.error('Optional auth middleware error', { error: error.message });
      next();
    }
  };
}