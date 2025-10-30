import { EmailTemplate } from '../src/models/index.js';
import logger from '../src/config/logger.js';

export const seedEmailTemplates = async () => {
  try {
    const templates = [
      {
        template_name: 'otp_registration',
        template_type: 'otp',
        subject: 'Welcome to {{companyName}} - Verify Your Email',
        body_html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f4f4f4; }
              .otp-box { background-color: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 5px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>{{companyName}}</h1>
              </div>
              <div class="content">
                <h2>Hello {{userName}},</h2>
                <p>Thank you for registering with us. Please use the following OTP to verify your email address:</p>
                <div class="otp-box">
                  <div class="otp-code">{{otp}}</div>
                </div>
                <p>This OTP is valid for {{validityMinutes}} minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
              </div>
              <div class="footer">
                <p>© {{companyName}}. All rights reserved.</p>
                <p>Need help? Contact us at {{supportEmail}}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        body_text: `Hello {{userName}}, Your OTP for registration is: {{otp}}. Valid for {{validityMinutes}} minutes.`,
        variables: ['userName', 'otp', 'validityMinutes', 'companyName', 'supportEmail'],
        is_active: true
      },
      {
        template_name: 'otp_login',
        template_type: 'otp',
        subject: 'Login Verification - {{companyName}}',
        body_html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f4f4f4; }
              .otp-box { background-color: white; padding: 20px; margin: 20px 0; text-align: center; border-radius: 5px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #2196F3; letter-spacing: 5px; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Login Verification</h1>
              </div>
              <div class="content">
                <h2>Hello {{userName}},</h2>
                <p>Your login verification code is:</p>
                <div class="otp-box">
                  <div class="otp-code">{{otp}}</div>
                </div>
                <p>This code expires in {{validityMinutes}} minutes.</p>
                <p>If you didn't attempt to login, please secure your account immediately.</p>
              </div>
              <div class="footer">
                <p>© {{companyName}}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        body_text: `Your login OTP is: {{otp}}. Valid for {{validityMinutes}} minutes.`,
        variables: ['userName', 'otp', 'validityMinutes', 'companyName'],
        is_active: true
      },
      {
        template_name: 'welcome_email',
        template_type: 'notification',
        subject: 'Welcome to {{companyName}}!',
        body_html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to {{companyName}}!</h1>
              </div>
              <div class="content">
                <h2>Hello {{userName}},</h2>
                <p>Your account has been successfully created as a <strong>{{userType}}</strong>.</p>
                <p>You can now access all the features available for your account type.</p>
                <center>
                  <a href="{{loginUrl}}" class="button">Login to Your Account</a>
                </center>
                <p>If you have any questions, feel free to reach out to our support team.</p>
              </div>
              <div class="footer">
                <p>© {{companyName}}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        body_text: `Welcome {{userName}}! Your {{userType}} account has been created. Login at: {{loginUrl}}`,
        variables: ['userName', 'userType', 'loginUrl', 'companyName'],
        is_active: true
      },
      {
        template_name: 'account_approved',
        template_type: 'notification',
        subject: 'Your {{companyName}} Account Has Been Approved!',
        body_html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .success-box { background-color: #e8f5e9; border-left: 4px solid #4CAF50; padding: 20px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Account Approved!</h1>
              </div>
              <div class="content">
                <h2>Hello {{userName}},</h2>
                <div class="success-box">
                  <p>Great news! Your account has been approved by our administrators.</p>
                  <p>You can now log in and access all features for your <strong>{{userType}}</strong> account.</p>
                </div>
                <p>Get started by logging into your account:</p>
                <center>
                  <a href="{{loginUrl}}" class="button">Login Now</a>
                </center>
                <p>If you have any questions about your account or need assistance, please don't hesitate to contact our support team.</p>
              </div>
              <div class="footer">
                <p>© {{companyName}}. All rights reserved.</p>
                <p>If you need help, contact us at {{supportEmail}}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        body_text: `Hello {{userName}}, Your {{userType}} account has been approved! You can now login at: {{loginUrl}}`,
        variables: ['userName', 'userType', 'loginUrl', 'companyName', 'supportEmail'],
        is_active: true
      },
      {
        template_name: 'account_rejected',
        template_type: 'notification',
        subject: 'Account Status Update - {{companyName}}',
        body_html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f44336; color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .message-box { background-color: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0; }
              .contact-button { display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; border-top: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Account Status Update</h1>
              </div>
              <div class="content">
                <h2>Hello {{userName}},</h2>
                <div class="message-box">
                  <p>We regret to inform you that your account registration request has not been approved at this time.</p>
                  {{#if rejectionReason}}
                  <p><strong>Reason:</strong> {{rejectionReason}}</p>
                  {{/if}}
                </div>
                <p>If you believe this was done in error or would like to discuss this further, please contact our support team:</p>
                <center>
                  <a href="mailto:{{supportEmail}}" class="contact-button">Contact Support</a>
                </center>
                <p>You may submit a new registration request after addressing the concerns mentioned above.</p>
              </div>
              <div class="footer">
                <p>© {{companyName}}. All rights reserved.</p>
                <p>Support email: {{supportEmail}}</p>
              </div>
            </div>
          </body>
          </html>
        `,
        body_text: `Hello {{userName}}, We regret to inform you that your account registration has not been approved.{{#if rejectionReason}} Reason: {{rejectionReason}}{{/if}} For support, contact: {{supportEmail}}`,
        variables: ['userName', 'rejectionReason', 'companyName', 'supportEmail'],
        is_active: true
      },
      {
        template_name: 'quotation_created',
        template_type: 'notification',
        subject: 'New Quotation: {{quotationNumber}}',
        body_html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .details { background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .button { display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>New Quotation Available</h1>
              </div>
              <div class="content">
                <h2>Hello {{recipientName}},</h2>
                <p>A new quotation has been created and is now available for your response.</p>
                <div class="details">
                  <p><strong>Quotation Number:</strong> {{quotationNumber}}</p>
                  <p><strong>Title:</strong> {{quotationName}}</p>
                  <p><strong>Valid Until:</strong> {{validityDate}}</p>
                </div>
                <center>
                  <a href="{{quotationUrl}}" class="button">View Quotation</a>
                </center>
              </div>
            </div>
          </body>
          </html>
        `,
        body_text: `New quotation {{quotationNumber}} - {{quotationName}} is available. Valid until {{validityDate}}. View at: {{quotationUrl}}`,
        variables: ['recipientName', 'quotationNumber', 'quotationName', 'validityDate', 'quotationUrl', 'companyName'],
        is_active: true
      },
      {
        template_name: 'stock_alert',
        template_type: 'alert',
        subject: 'Low Stock Alert - {{itemName}}',
        body_html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .alert-box { background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0; }
              .button { display: inline-block; padding: 12px 30px; background-color: #f44336; color: white; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Low Stock Alert</h1>
              </div>
              <div class="content">
                <h2>Hello {{managerName}},</h2>
                <div class="alert-box">
                  <p><strong>Store:</strong> {{storeName}}</p>
                  <p><strong>Item:</strong> {{itemName}} ({{itemCode}})</p>
                  <p><strong>Current Stock:</strong> {{currentStock}}</p>
                  <p><strong>Minimum Stock Level:</strong> {{minStock}}</p>
                </div>
                <p>Please take immediate action to replenish the stock.</p>
                <center>
                  <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
                </center>
              </div>
            </div>
          </body>
          </html>
        `,
        body_text: `Low stock alert for {{itemName}} in {{storeName}}. Current: {{currentStock}}, Minimum: {{minStock}}`,
        variables: ['managerName', 'storeName', 'itemName', 'itemCode', 'currentStock', 'minStock', 'dashboardUrl', 'companyName'],
        is_active: true
      }
    ];

    for (const template of templates) {
      await EmailTemplate.findOrCreate({
        where: { template_name: template.template_name },
        defaults: {
          ...template,
          variables: JSON.stringify(template.variables)
        }
      });
    }

    logger.info('Email templates seeded successfully');
  } catch (error) {
    logger.error('Error seeding email templates:', error);
    throw error;
  }
};