import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'segredo-padrão';

const auth = {
  generateToken: (userId: string): string => {
    return jwt.sign({ userId }, SECRET, { expiresIn: '30d' });
  },

  verifyToken: (req: Request, res: Response, next: NextFunction): Response | void => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
      const decoded = jwt.verify(token, SECRET) as { userId: string };
      (req as any).userId = decoded.userId;

      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  }
};

export default auth;
