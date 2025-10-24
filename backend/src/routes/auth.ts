import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key-change-in-production-2025';

// Простая авторизация для демо
const DEMO_USERS = {
  demo: {
    password: 'demo',
    role: 'operator',
    name: 'Демо Оператор'
  },
  admin: {
    password: 'admin',
    role: 'admin',
    name: 'Администратор'
  }
};

/**
 * POST /api/auth/demo-login
 * Простая авторизация для демонстрации
 */
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Валидация входных данных
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Логин и пароль обязательны'
      });
    }

    // Проверка учётных данных
    const user = DEMO_USERS[username as keyof typeof DEMO_USERS];
    
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Неверный логин или пароль'
      });
    }

    // Генерация JWT токена
    const token = jwt.sign(
      {
        username,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      data: {
        token,
        user: {
          username,
          role: user.role,
          name: user.name
        }
      }
    });

  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

/**
 * POST /api/auth/verify
 * Проверка токена
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        username: string;
        role: string;
        name: string;
      };

      return res.json({
        success: true,
        data: {
          user: {
            username: decoded.username,
            role: decoded.role,
            name: decoded.name
          }
        }
      });

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
});

export default router;