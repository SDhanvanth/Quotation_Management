import rateLimit from 'express-rate-limit';
import config from '../config/config.js';
import logger from '../config/logger.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip in development mode
    return config.env === 'development'; // ← Changed to config.env
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.originalUrl}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Authentication rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return config.env === 'development'; // ← Changed to config.env
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.'
    });
  }
});

// Strict rate limiter
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === 'development' // ← Changed to config.env
});

// Browse limiter
export const browseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === 'development' // ← Changed to config.env
});

export default {
  apiLimiter,
  authLimiter,
  strictLimiter,
  browseLimiter
};