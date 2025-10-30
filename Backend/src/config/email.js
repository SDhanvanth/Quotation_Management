import nodemailer from 'nodemailer';
import config from './config.js';
import logger from './logger.js';

const createTransporter = () => {
  if (config.email.service === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  } else if (config.email.service === 'smtp') {
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure, // true if using port 465
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  } else if (config.email.service === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: config.email.sendgridApiKey,
      },
    });
  } else {
    throw new Error(`Unsupported email service: ${config.email.service}`);
  }
};

const transporter = createTransporter();

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('Email transporter is ready to send emails');
  }
});

export default transporter;