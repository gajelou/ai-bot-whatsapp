import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'segredo-padrão';

// Gera um token JWT válido por 24 horas
export const generateToken = (userId) => {
  return jwt.sign({ userId }, SECRET, { expiresIn: '1d' });
};

// Middleware para verificar o JWT
export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId; // Adiciona o ID do usuário ao request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
