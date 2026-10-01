import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('JWT_SECRET is not set in environment variables, using default fallback secret');
    return 'lostcamp_jwt_secret_default_key_2026_super_secret';
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

export function generateToken(payload: {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Необходима авторизация. Токен отсутствует.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Недействительный или истекший токен авторизации.',
    });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Требуются права администратора.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;

    if (decoded.role === 'admin') {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Доступ запрещен. Требуются права администратора.',
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Недействительный или истекший токен администратора.',
    });
  }
}
