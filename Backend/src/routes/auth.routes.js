import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register',
  authLimiter,
  [
    body('username').isLength({ min: 3 }).trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('type_id').isInt()
  ],
  validate,
  authController.register
);

router.post('/login',
  authLimiter,
  [
    body('username').notEmpty(),
    body('password').notEmpty()
  ],
  validate,
  authController.login
);

router.post('/refresh-token',
  [body('refreshToken').notEmpty()],
  validate,
  authController.refreshToken
);

router.post('/logout',
  authenticate,
  authController.logout
);

router.post('/verify-email',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 })
  ],
  validate,
  authController.verifyEmail
);

router.post('/login-otp',
  authLimiter,
  [body('username').notEmpty()],
  validate,
  authController.loginWithOTP
);

router.post('/verify-login-otp',
  authLimiter,
  [
    body('username').notEmpty(),
    body('otp').isLength({ min: 6, max: 6 })
  ],
  validate,
  authController.verifyLoginOTP
);

router.post('/forgot-password',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.forgotPassword
);

router.post('/reset-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 6 })
  ],
  validate,
  authController.resetPassword
);

router.post('/resend-otp',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('type').isIn(['registration', 'login', 'password_reset', 'email_verification'])
  ],
  validate,
  authController.resendOTP
);

export default router;