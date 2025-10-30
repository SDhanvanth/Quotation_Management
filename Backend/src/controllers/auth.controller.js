import authService from '../services/auth.service.js';
import otpService from '../services/otp.service.js';
import emailService from '../services/email.service.js';
import logger from '../config/logger.js';
import { UserActivityLog, User, UserType } from '../models/index.js';
import notificationService from '../services/notification.service.js';

export const register = async (req, res, next) => {
  try {
    const { username, email, password, type_id } = req.body;
    
    const result = await authService.register({ 
      username, 
      email, 
      password, 
      type_id
    });
    
    // Send OTP for email verification
    await otpService.createOTP(email, 'email_verification', result.user.user_id, req.ip);
    
    await UserActivityLog.create({
      user_id: result.user.user_id,
      activity_type: 'REGISTRATION',
      activity_description: 'User registered successfully',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Create notification for admin if user is store or retailer
    if (result.requiresApproval) {
      const adminType = await UserType.findOne({ where: { type_name: 'admin' } });
      const adminUsers = await User.findAll({ where: { type_id: adminType.type_id } });
      
      for (const admin of adminUsers) {
        await notificationService.createNotification({
          user_id: admin.user_id,
          type: 'NEW_USER_APPROVAL',
          title: 'New User Registration',
          message: `New ${result.user.UserType.type_name} account registered: ${username} (${email}) needs approval`,
          data: {
            user_id: result.user.user_id,
            username,
            email,
            type: result.user.UserType.type_name
          }
        });
      }
    }

    if (result.requiresApproval) {
      res.status(201).json({
        message: result.message,
        user: result.user,
        requiresEmailVerification: true,
        requiresApproval: true
      });
    } else {
      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
        requiresEmailVerification: true,
        requiresApproval: false
      });
    }
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    const otpResult = await otpService.verifyOTP(email, otp, 'email_verification');
    
    if (otpResult.success) {
      const result = await authService.verifyUserEmail(otpResult.userId);
      
      // Send welcome email
      await emailService.sendWelcomeEmail(result.user);
      
      if (result.needsApproval) {
        res.json({
          message: 'Email verified successfully. Your account is pending admin approval.',
          user: result.user,
          requiresApproval: true
        });
      } else {
        const tokens = await authService.generateTokens(result.user.user_id);
        
        res.json({
          message: 'Email verified successfully',
          user: result.user,
          ...tokens,
          requiresApproval: false
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.username, req.body.password);
    
    await UserActivityLog.create({
      user_id: result.user.user_id,
      activity_type: 'LOGIN',
      activity_description: 'User logged in successfully',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Return firstLogin flag so frontend can handle redirect
    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
      firstLogin: result.user.first_login
    });
  } catch (error) {
    next(error);
  }
};

export const loginWithOTP = async (req, res, next) => {
  try {
    const { username } = req.body;
    
    const user = await authService.findUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check approval status before sending OTP
    if (user.UserType.type_name !== 'admin' && !user.is_approved) {
      return res.status(403).json({ error: 'Your account is pending admin approval' });
    }
    
    await otpService.createOTP(user.email, 'login', user.user_id, req.ip);
    
    res.json({
      message: 'OTP sent to your registered email',
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });
  } catch (error) {
    next(error);
  }
};

export const verifyLoginOTP = async (req, res, next) => {
  try {
    const { username, otp } = req.body;
    
    const user = await authService.findUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const result = await otpService.verifyOTP(user.email, otp, 'login');
    
    if (result.success) {
      // No need to check for store/retailer details here
      // The frontend will handle redirecting based on first_login flag
      // If first_login is true, frontend redirects to setup page
      // If first_login is false, frontend redirects to dashboard

      const tokens = await authService.generateTokens(user.user_id);
      
      await UserActivityLog.create({
        user_id: user.user_id,
        activity_type: 'LOGIN_OTP',
        activity_description: 'User logged in with OTP',
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
      
      // Return firstLogin flag so frontend can handle redirect
      res.json({
        message: 'Login successful',
        user,
        ...tokens,
        firstLogin: user.first_login
      });
    }
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await authService.findUserByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, an OTP has been sent.' });
    }
    
    await otpService.createOTP(email, 'password_reset', user.user_id, req.ip);
    
    res.json({ message: 'If the email exists, an OTP has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const result = await otpService.verifyOTP(email, otp, 'password_reset');
    
    if (result.success) {
      await authService.resetPassword(result.userId, newPassword);
      
      const user = await authService.getUserById(result.userId);
      await emailService.sendPasswordResetSuccess(user);
      
      res.json({ message: 'Password reset successful' });
    }
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    
    const user = await authService.findUserByEmail(email);
    
    await otpService.resendOTP(email, type, user?.user_id, req.ip);
    
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    
    res.json({
      message: 'Token refreshed successfully',
      token: result.token,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await UserActivityLog.create({
      user_id: req.user.user_id,
      activity_type: 'LOGOUT',
      activity_description: 'User logged out',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  verifyEmail,
  loginWithOTP,
  verifyLoginOTP,
  forgotPassword,
  resetPassword,
  resendOTP,
  refreshToken,
  logout
};