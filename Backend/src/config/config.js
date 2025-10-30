import dotenv from 'dotenv';
dotenv.config();

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    pool: {
      max: 10,  // Reduced to prevent connection overhead
      min: 2,   // Reduced minimum connections
      acquire: 20000, // Reduced timeout
      idle: 5000     // Reduced idle time
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX)
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // Default 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || 1000) // Default 1000 requests
  },
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail', // 'gmail', 'smtp', 'sendgrid'
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    from: process.env.EMAIL_FROM || 'noreply@quotationmanagement.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Quotation Management System'
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS) || 3,
    maxResends: parseInt(process.env.OTP_MAX_RESENDS) || 3,
    resendCooldown: parseInt(process.env.OTP_RESEND_COOLDOWN) || 1, // minutes
    length: parseInt(process.env.OTP_LENGTH) || 6
  },
  
  app: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
  },
  
  company: {
    name: process.env.COMPANY_NAME || 'Quotation Management System',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@quotationmanagement.com'
  }
};