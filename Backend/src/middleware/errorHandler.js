import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Duplicate Entry',
      details: err.errors
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Foreign Key Constraint Error',
      details: err.message
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
};