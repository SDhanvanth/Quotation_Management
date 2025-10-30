import { User, UserType, Store, RetailerDetails, UserActivityLog, Quotation } from '../models/index.js';
import authService from '../services/auth.service.js';
import emailService from '../services/email.service.js';
import logger from '../config/logger.js';
import { Op, fn, col } from 'sequelize';

export const getPendingApprovals = async (req, res, next) => {
  try {
    const pendingUsers = await User.findAll({
      where: {
        is_approved: false,
        is_active: true,
        email_verified: true
      },
      include: [
        { model: UserType },
        { model: Store },
        { model: RetailerDetails }
      ],
      order: [['created_on', 'DESC']]
    });

    res.json({
      pendingUsers,
      count: pendingUsers.length
    });
  } catch (error) {
    next(error);
  }
};

export const approveUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { storeId } = req.body;
    
    const user = await authService.approveUser(userId, req.user.user_id, storeId);
    
    await emailService.sendAccountStatusChange(user, 'approved');
    
    res.json({
      message: 'User approved successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const rejectUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await authService.rejectUser(userId, req.user.user_id, reason);
    
    await emailService.sendAccountStatusChange(user, 'rejected', reason);
    
    res.json({
      message: 'User rejected',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const assignStore = async (req, res, next) => {
  try {
    const { userId, storeId } = req.body;
    
    const user = await User.findByPk(userId, {
      include: [{ model: UserType }]
    });
    
    if (!user || user.UserType.type_name !== 'store') {
      return res.status(400).json({ error: 'Invalid user or user is not a store type' });
    }
    
    await Store.update(
      { user_id: userId },
      { where: { store_id: storeId } }
    );
    
    res.json({
      message: 'Store assigned successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getUnassignedStores = async (req, res, next) => {
  try {
    const unassignedStores = await Store.findAll({
      where: {
        user_id: null,
        is_active: true
      }
    });
    
    res.json({
      stores: unassignedStores,
      count: unassignedStores.length
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const totalUsers = await User.count({ where: { is_active: true } });
    const lastMonthUsers = await User.count({ 
      where: { 
        is_active: true,
        created_on: { [Op.lt]: lastMonth }
      }
    });

    const totalQuotations = await Quotation.count();
    const lastMonthQuotations = await Quotation.count({
      where: { created_on: { [Op.lt]: lastMonth } }
    });

    const revenueResult = await Quotation.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'total']],
      where: { status: 'approved' }
    });
    const totalRevenue = revenueResult?.getDataValue('total') || 0;

    const lastMonthRevenue = await Quotation.findOne({
      attributes: [[fn('SUM', col('total_amount')), 'total']],
      where: { 
        status: 'approved',
        created_on: { [Op.lt]: lastMonth }
      }
    });
    const lastMonthTotalRevenue = lastMonthRevenue?.getDataValue('total') || 0;

    const activeStores = await Store.count({ where: { is_active: true } });
    const lastMonthStores = await Store.count({ 
      where: { 
        is_active: true,
        created_on: { [Op.lt]: lastMonth }
      }
    });

    const calculateTrend = (current, previous) => {
      if (!previous) return 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };

    const recentActivity = await UserActivityLog.findAll({
      include: [{ 
        model: User,
        attributes: ['username']
      }],
      order: [['created_on', 'DESC']],
      limit: 5
    });

    const quotationTrends = await Quotation.findAll({
      attributes: [
        [fn('DATE', col('created_on')), 'date'],
        [fn('COUNT', '*'), 'count']
      ],
      where: {
        created_on: {
          [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      group: [fn('DATE', col('created_on'))],
      order: [[fn('DATE', col('created_on')), 'ASC']]
    });

    res.json({
      stats: {
        totalUsers,
        totalQuotations,
        totalRevenue,
        activeStores,
        usersTrend: calculateTrend(totalUsers, lastMonthUsers),
        quotationsTrend: calculateTrend(totalQuotations, lastMonthQuotations),
        revenueTrend: calculateTrend(totalRevenue, lastMonthTotalRevenue),
        storesTrend: calculateTrend(activeStores, lastMonthStores)
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.log_id,
        type: activity.activity_type,
        description: activity.activity_description,
        time: formatTimeAgo(activity.created_on),
        user: activity.User.username
      })),
      quotationTrends: quotationTrends.map(qt => ({
        date: qt.getDataValue('date'),
        count: parseInt(qt.getDataValue('count'))
      }))
    });
  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    next(error);
  }
};

export const getActivityLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      user_id, 
      activity_type, 
      date_from, 
      date_to 
    } = req.query;

    const where = {};
    
    if (user_id) where.user_id = user_id;
    if (activity_type) where.activity_type = activity_type;
    if (date_from && date_to) {
      where.created_on = {
        [Op.between]: [new Date(date_from), new Date(date_to)]
      };
    }

    const { count, rows } = await UserActivityLog.findAndCountAll({
      where,
      include: [{
        model: User,
        attributes: ['username', 'email']
      }],
      order: [['created_on', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting activity logs:', error);
    next(error);
  }
};

const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return Math.floor(seconds) + ' seconds ago';
};

export default {
  getPendingApprovals,
  approveUser,
  rejectUser,
  assignStore,
  getUnassignedStores,
  getDashboardStats,
  getActivityLogs
};