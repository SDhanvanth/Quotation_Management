import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { User, UserType } from '../models/index.js';
import logger from '../config/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      logger.warn('No authorization header provided');
      return res.status(401).json({ error: 'Please authenticate' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('No token in authorization header');
      return res.status(401).json({ error: 'Please authenticate' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      logger.error('JWT verification error:', jwtError.message);
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Please authenticate' });
    }
    
    // Find user
    const user = await User.findOne({
      where: { user_id: decoded.id, is_active: true },
      include: [{ model: UserType }]
    });

    if (!user) {
      logger.warn('User not found or inactive:', decoded.id);
      return res.status(401).json({ error: 'Please authenticate' });
    }

    logger.info(`User authenticated: ${user.username} (${user.UserType.type_name})`);

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userType = req.user.UserType.type_name;
    
    if (!allowedTypes.includes(userType)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.user_id} (${userType}). Allowed: ${allowedTypes.join(', ')}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};