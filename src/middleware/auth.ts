import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_medibed';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    hospitalId?: number;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user as any;
    next();
  });
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user && req.user.role ? req.user.role.toUpperCase() : '';
    if (!req.user || !roles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied: Insufficient privileges.' });
    }
    next();
  };
};
