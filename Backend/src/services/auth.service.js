import jwt from 'jsonwebtoken';
import { User, UserType, Store, RetailerDetails } from '../models/index.js';
import config from '../config/config.js';
import logger from '../config/logger.js';

class AuthService {
  async register(userData) {
    try {
      const existingUser = await User.findOne({
        where: { username: userData.username }
      });

      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Set approval status based on user type
      const userType = await UserType.findByPk(userData.type_id);
      const isAdmin = userType.type_name === 'admin';
      
      const user = await User.create({
        ...userData,
        is_approved: isAdmin, // Only admin is auto-approved
        email_verified: false
      });

      const userWithType = await User.findByPk(user.user_id, {
        include: [{ model: UserType }]
      });

      // Don't generate tokens for unapproved users
      if (!isAdmin) {
        return {
          user: userWithType,
          requiresApproval: true,
          message: 'Registration successful. Your account is pending admin approval.'
        };
      }

      const token = this.generateToken(user.user_id);
      const refreshToken = this.generateRefreshToken(user.user_id);

      return {
        user: userWithType,
        token,
        refreshToken,
        requiresApproval: false
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(username, password) {
    try {
      const user = await User.findOne({
        where: { username, is_active: true },
        include: [
          { model: UserType },
          { 
            model: Store,
            required: false
          },
          { 
            model: RetailerDetails,
            required: false
          }
        ]
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Check if email is verified
      if (!user.email_verified) {
        throw new Error('Please verify your email before logging in');
      }

      // Check if user is approved (except admin)
      if (user.UserType.type_name !== 'admin' && !user.is_approved) {
        throw new Error('Your account is pending admin approval');
      }

      // ✅ REMOVED: Retailer details check - let frontend handle redirect based on first_login
      // The frontend will redirect to setup page if first_login is true
      // No need to block login if retailer details don't exist yet

      const token = this.generateToken(user.user_id);
      const refreshToken = this.generateRefreshToken(user.user_id);

      return {
        user,
        token,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async approveUser(userId, adminId, storeId = null) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: UserType }]
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update user approval status
      await user.update({
        is_approved: true,
        approved_by: adminId,
        approved_on: new Date()
      });

      // If store user and storeId provided, assign store
      if (user.UserType.type_name === 'store' && storeId) {
        await Store.update(
          { user_id: userId },
          { where: { store_id: storeId } }
        );
      }

      return user;
    } catch (error) {
      logger.error('Approve user error:', error);
      throw error;
    }
  }

  async rejectUser(userId, adminId, reason) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      await user.update({
        is_approved: false,
        is_active: false,
        approved_by: adminId,
        approved_on: new Date(),
        rejection_reason: reason
      });

      return user;
    } catch (error) {
      logger.error('Reject user error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await User.findByPk(decoded.id);

      if (!user || !user.is_active || !user.is_approved) {
        throw new Error('Invalid refresh token');
      }

      const newToken = this.generateToken(user.user_id);
      const newRefreshToken = this.generateRefreshToken(user.user_id);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }

  async verifyUserEmail(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: UserType }]
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.update({ email_verified: true });
      
      // Check if user needs approval
      const needsApproval = user.UserType.type_name !== 'admin' && !user.is_approved;
      
      return {
        user,
        needsApproval
      };
    } catch (error) {
      logger.error('Verify user email error:', error);
      throw error;
    }
  }

  async findUserByUsername(username) {
    try {
      return await User.findOne({
        where: { username, is_active: true },
        include: [
          { model: UserType },
          { model: Store, required: false },
          { model: RetailerDetails, required: false }
        ]
      });
    } catch (error) {
      logger.error('Find user by username error:', error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      return await User.findOne({
        where: { email, is_active: true },
        include: [{ model: UserType }]
      });
    } catch (error) {
      logger.error('Find user by email error:', error);
      throw error;
    }
  }

  async resetPassword(userId, newPassword) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      user.password = newPassword;
      await user.save();
      
      return user;
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      return await User.findByPk(userId, {
        include: [
          { model: UserType },
          { model: Store, required: false },
          { model: RetailerDetails, required: false }
        ]
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async generateTokens(userId) {
    const token = this.generateToken(userId);
    const refreshToken = this.generateRefreshToken(userId);
    
    return { token, refreshToken };
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }
}

export default new AuthService();