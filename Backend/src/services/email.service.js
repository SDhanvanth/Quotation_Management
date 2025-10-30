import transporter from '../config/email.js';
import { EmailTemplate, EmailLog, User } from '../models/index.js';
import config from '../config/config.js';
import logger from '../config/logger.js';
import handlebars from 'handlebars';

class EmailService {
  constructor() {
    this.registerHelpers();
  }

  registerHelpers() {
    handlebars.registerHelper('formatDate', (date) => {
      return new Date(date).toLocaleDateString();
    });
    
    handlebars.registerHelper('formatCurrency', (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    });
  }

  async sendEmail({ to, subject, html, text, templateName, variables = {}, userId = null }) {
    let emailLog = null;
    
    try {
      // Ensure we have a subject
      if (!subject && !templateName) {
        throw new Error('Either subject or templateName must be provided');
      }

      let finalHtml = html;
      let finalText = text;
      let finalSubject = subject || 'Notification from QuoteMaster';

      // If template name is provided, fetch from database
      if (templateName) {
        const template = await EmailTemplate.findOne({
          where: { template_name: templateName, is_active: true }
        });

        if (template) {
          const htmlTemplate = handlebars.compile(template.body_html);
          const textTemplate = template.body_text ? handlebars.compile(template.body_text) : null;
          const subjectTemplate = handlebars.compile(template.subject);

          // Merge default variables with provided variables
          const mergedVariables = {
            companyName: config.company.name,
            supportEmail: config.company.supportEmail,
            ...variables
          };

          finalHtml = htmlTemplate(mergedVariables);
          finalText = textTemplate ? textTemplate(mergedVariables) : finalText;
          finalSubject = subjectTemplate(mergedVariables);
        }
      }

      // Create email log
      emailLog = await EmailLog.create({
        user_id: userId,
        email_to: to,
        email_from: config.email.from,
        subject: finalSubject,
        template_used: templateName,
        status: 'pending'
      });

      const mailOptions = {
        from: `${config.email.fromName} <${config.email.from}>`,
        to,
        subject: finalSubject,
        html: finalHtml,
        text: finalText
      };

      const info = await transporter.sendMail(mailOptions);

      await emailLog.update({
        status: 'sent',
        sent_at: new Date(),
        metadata: { messageId: info.messageId }
      });

      logger.info(`Email sent successfully to ${to}`);
      return info;
    } catch (error) {
      if (emailLog) {
        await emailLog.update({
          status: 'failed',
          error_message: error.message
        });
      }

      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendOTPEmail(email, otp, type, userName = '') {
    const templates = {
      registration: 'otp_registration',
      login: 'otp_login',
      password_reset: 'otp_password_reset',
      email_verification: 'otp_registration' // Use otp_registration template for email verification
    };

    const subjects = {
      registration: 'Verify Your Registration - OTP',
      login: 'Login Verification - OTP',
      password_reset: 'Password Reset - OTP',
      email_verification: 'Email Verification - OTP'
    };

    return await this.sendEmail({
      to: email,
      subject: subjects[type],
      templateName: templates[type],
      variables: {
        userName: userName || email.split('@')[0],
        otp,
        validityMinutes: config.otp.expiryMinutes,
        companyName: config.company.name,
        supportEmail: config.company.supportEmail
      }
    });
  }

  async sendWelcomeEmail(user) {
    return await this.sendEmail({
      to: user.email,
      templateName: 'welcome_email',
      variables: {
        userName: user.username,
        userType: user.UserType.type_name,
        loginUrl: `${config.app.frontendUrl}/login`,
        companyName: config.company.name
      },
      userId: user.user_id
    });
  }

  async sendQuotationNotification(quotation, recipients, type) {
    const templates = {
      created: 'quotation_created',
      updated: 'quotation_updated',
      submitted: 'quotation_submitted',
      awarded: 'quotation_awarded'
    };

    const emailPromises = recipients.map(recipient => 
      this.sendEmail({
        to: recipient.email,
        templateName: templates[type],
        variables: {
          recipientName: recipient.name,
          quotationNumber: quotation.quotation_number,
          quotationName: quotation.quotation_name,
          validityDate: quotation.validity_until,
          quotationUrl: `${config.app.frontendUrl}/quotations/${quotation.quotation_id}`,
          companyName: config.company.name
        },
        userId: recipient.user_id
      })
    );

    return await Promise.allSettled(emailPromises);
  }

  async sendStockAlert(store, item, currentStock, minStock) {
    const storeManagers = await User.findAll({
      include: [{
        model: Store,
        where: { store_id: store.store_id }
      }]
    });

    const emailPromises = storeManagers.map(manager =>
      this.sendEmail({
        to: manager.email,
        templateName: 'stock_alert',
        variables: {
          managerName: manager.username,
          storeName: store.store_name,
          itemName: item.item_name,
          itemCode: item.item_code,
          currentStock,
          minStock,
          dashboardUrl: `${config.app.frontendUrl}/stock`,
          companyName: config.company.name
        },
        userId: manager.user_id
      })
    );

    return await Promise.allSettled(emailPromises);
  }

  async sendPasswordResetSuccess(user) {
    return await this.sendEmail({
      to: user.email,
      templateName: 'password_reset_success',
      variables: {
        userName: user.username,
        resetTime: new Date(),
        supportEmail: config.company.supportEmail,
        companyName: config.company.name
      },
      userId: user.user_id
    });
  }

  async sendAccountStatusChange(user, status, reason = '') {
    return await this.sendEmail({
      to: user.email,
      templateName: 'account_status_change',
      variables: {
        userName: user.username,
        status,
        reason,
        supportEmail: config.company.supportEmail,
        companyName: config.company.name
      },
      userId: user.user_id
    });
  }

  async sendAccountApprovalEmail(user) {
    return await this.sendEmail({
      to: user.email,
      templateName: 'account_approved',
      variables: {
        userName: user.username,
        userType: user.UserType.type_name,
        loginUrl: `${config.app.frontendUrl}/login`,
        companyName: config.company.name,
        supportEmail: config.company.supportEmail
      },
      userId: user.user_id
    });
  }

  async sendAccountRejectionEmail(user, reason) {
    return await this.sendEmail({
      to: user.email,
      templateName: 'account_rejected',
      variables: {
        userName: user.username,
        reason,
        supportEmail: config.company.supportEmail,
        companyName: config.company.name
      },
      userId: user.user_id
    });
  }

  async getEmailLogs({ userId, status, startDate, endDate, page = 1, limit = 10 }) {
    const where = {};
    
    if (userId) where.user_id = userId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.created_on = {};
      if (startDate) where.created_on[Op.gte] = startDate;
      if (endDate) where.created_on[Op.lte] = endDate;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await EmailLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_on', 'DESC']]
    });

    return {
      logs: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }
}

export default new EmailService();