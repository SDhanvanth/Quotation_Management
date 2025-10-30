import { OTP, User } from '../models/index.js';
import { Op } from 'sequelize';
import crypto from 'crypto';
import config from '../config/config.js';
import logger from '../config/logger.js';
import emailService from './email.service.js';

class OTPService {
  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  async createOTP(email, type, userId = null, ipAddress = null) {
    try {
      // Invalidate previous OTPs
      await OTP.update(
        { is_used: true },
        {
          where: {
            email,
            otp_type: type,
            is_used: false
          }
        }
      );

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiryMinutes);

      const otp = await OTP.create({
        user_id: userId,
        email,
        otp_code: otpCode,
        otp_type: type,
        expires_at: expiresAt,
        ip_address: ipAddress
      });

      // Send OTP email
      const user = userId ? await User.findByPk(userId) : null;
      await emailService.sendOTPEmail(email, otpCode, type, user?.username || '');

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt
      };
    } catch (error) {
      logger.error('Create OTP error:', error);
      throw error;
    }
  }

  async verifyOTP(email, otpCode, type) {
    try {
      const otp = await OTP.findOne({
        where: {
          email,
          otp_code: otpCode,
          otp_type: type,
          is_used: false,
          expires_at: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!otp) {
        // Increment attempts for rate limiting
        await OTP.increment('attempts', {
          where: {
            email,
            otp_type: type,
            is_used: false
          }
        });
        
        throw new Error('Invalid or expired OTP');
      }

      // Check max attempts
      if (otp.attempts >= config.otp.maxAttempts) {
        await otp.update({ is_used: true });
        throw new Error('Maximum OTP attempts exceeded');
      }

      // Mark OTP as used
      await otp.update({ is_used: true });

      return {
        success: true,
        message: 'OTP verified successfully',
        userId: otp.user_id
      };
    } catch (error) {
      logger.error('Verify OTP error:', error);
      throw error;
    }
  }

  async resendOTP(email, type, userId = null, ipAddress = null) {
    try {
      // Check rate limiting
      const recentOTPs = await OTP.count({
        where: {
          email,
          otp_type: type,
          created_on: {
            [Op.gte]: new Date(Date.now() - config.otp.resendCooldown * 60 * 1000)
          }
        }
      });

      if (recentOTPs >= config.otp.maxResends) {
        throw new Error('Too many OTP requests. Please try again later.');
      }

      return await this.createOTP(email, type, userId, ipAddress);
    } catch (error) {
      logger.error('Resend OTP error:', error);
      throw error;
    }
  }

  async cleanupExpiredOTPs() {
    try {
      const result = await OTP.destroy({
        where: {
          [Op.or]: [
            {
              expires_at: {
                [Op.lt]: new Date()
              }
            },
            {
              is_used: true,
              created_on: {
                [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
              }
            }
          ]
        }
      });

      logger.info(`Cleaned up ${result} expired OTPs`);
      return result;
    } catch (error) {
      logger.error('Cleanup expired OTPs error:', error);
      throw error;
    }
  }
}

export default new OTPService();