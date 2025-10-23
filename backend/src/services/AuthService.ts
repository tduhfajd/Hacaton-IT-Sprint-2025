import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, User } from '../models/User';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role?: 'citizen' | 'operator' | 'admin';
}

export interface AuthResult {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  private accessTokenSecret: jwt.Secret;
  private refreshTokenSecret: jwt.Secret;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor(private userModel: UserModel) {
    this.accessTokenSecret = process.env['JWT_SECRET'] || 'fallback-secret';
    this.refreshTokenSecret = process.env['JWT_REFRESH_SECRET'] || this.accessTokenSecret;
    this.accessTokenExpiry = process.env['JWT_EXPIRES_IN'] || '24h';
    this.refreshTokenExpiry = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';
  }

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const existingUser = await this.userModel.findByEmail(data.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const user = await this.userModel.create(data);
      const tokens = this.generateTokens(user);

      logger.info(`User registered: ${user.email}`, { userId: user.id, role: user.role });

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error: any) {
      logger.error('Registration failed', { error: error.message, email: data.email });
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;
      const user = await this.userModel.findByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      const isValidPassword = await this.userModel.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const tokens = this.generateTokens(user);

      logger.info(`User logged in: ${user.email}`, { userId: user.id, role: user.role });

      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error: any) {
      logger.error('Login failed', { error: error.message, email: credentials.email });
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret) as TokenPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await this.userModel.findById(payload.userId);
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      const accessToken = this.generateAccessToken(user);
      logger.info(`Token refreshed for user: ${user.email}`, { userId: user.id });
      return { accessToken };
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    logger.info('User logged out', { userId });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await this.userModel.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    await this.userModel.updatePassword(userId, newPassword);
    logger.info('Password changed for user', { userId });
  }

  async resetPassword(email: string): Promise<void> {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      logger.info('Password reset requested for non-existent email', { email });
      return;
    }
    logger.info('Password reset requested', { userId: user.id, email: user.email });
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
    } catch {
      throw new Error('Invalid access token');
    }
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  private generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };
    return jwt.sign(payload, this.accessTokenSecret, { expiresIn: this.accessTokenExpiry as any });
  }

  private generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    };
    return jwt.sign(payload, this.refreshTokenSecret, { expiresIn: this.refreshTokenExpiry as any });
  }

  private sanitizeUser(user: User): Omit<User, 'password_hash'> {
    const { password_hash, ...sanitizedUser } = user as any;
    return sanitizedUser as Omit<User, 'password_hash'>;
  }
}
