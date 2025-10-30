import emailService from '../services/email.service.js';
import { Store, RetailerDetails, User } from '../models/index.js';
import logger from '../config/logger.js';

export const notifyQuotationCreated = async (quotation) => {
  try {
    // Get all active retailers
    const retailers = await RetailerDetails.findAll({
      where: { is_active: true },
      include: [{ model: User }]
    });

    const recipients = retailers.map(r => ({
      email: r.User.email,
      name: r.retailer_name,
      user_id: r.user_id
    }));

    await emailService.sendQuotationNotification(quotation, recipients, 'created');
  } catch (error) {
    logger.error('Failed to send quotation created notifications:', error);
  }
};

export const notifyQuotationAwarded = async (quotation, winnerId) => {
  try {
    // Notify winner
    const winner = await RetailerDetails.findByPk(winnerId, {
      include: [{ model: User }]
    });

    if (winner) {
      await emailService.sendEmail({
        to: winner.User.email,
        templateName: 'quotation_awarded_winner',
        variables: {
          retailerName: winner.retailer_name,
          quotationNumber: quotation.quotation_number,
          quotationName: quotation.quotation_name
        },
        userId: winner.user_id
      });
    }

    // Notify other participants
    const otherRetailers = await RetailerQuotation.findAll({
      where: {
        quotation_id: quotation.quotation_id,
        retailer_id: { [Op.ne]: winnerId }
      },
      include: [
        {
          model: RetailerDetails,
          include: [{ model: User }]
        }
      ]
    });

    for (const rq of otherRetailers) {
      await emailService.sendEmail({
        to: rq.RetailerDetail.User.email,
        templateName: 'quotation_awarded_participant',
        variables: {
          retailerName: rq.RetailerDetail.retailer_name,
          quotationNumber: quotation.quotation_number,
          quotationName: quotation.quotation_name
        },
        userId: rq.RetailerDetail.user_id
      });
    }
  } catch (error) {
    logger.error('Failed to send quotation awarded notifications:', error);
  }
};

export const notifyLowStock = async (stock, item, store) => {
  try {
    await emailService.sendStockAlert(
      store,
      item,
      stock.current_stock,
      stock.min_stock_level
    );
  } catch (error) {
    logger.error('Failed to send low stock notification:', error);
  }
};

export const notifyAccountStatusChange = async (user, newStatus, reason = '') => {
  try {
    await emailService.sendAccountStatusChange(user, newStatus, reason);
  } catch (error) {
    logger.error('Failed to send account status change notification:', error);
  }
};