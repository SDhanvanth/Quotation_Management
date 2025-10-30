// routes/report.routes.js
import express from 'express';
import reportController from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Item Reports
router.get('/items', 
  authenticate, 
  authorize('admin', 'store'), 
  reportController.getItemReport
);

router.get('/items/export', 
  authenticate, 
  authorize('admin', 'store'), 
  reportController.exportItemReport
);

// Stock Reports
router.get('/stock', 
  authenticate, 
  authorize('admin', 'store'), 
  reportController.getStockReport
);

router.get('/stock/export', 
  authenticate, 
  authorize('admin', 'store'), 
  reportController.exportStockReport
);

// Store Reports (Admin only)
router.get('/stores', 
  authenticate, 
  authorize('admin'), 
  reportController.getStoreReport
);

router.get('/stores/export', 
  authenticate, 
  authorize('admin'), 
  reportController.exportStoreReport
);

// Retailer Reports (Admin only)
router.get('/retailers', 
  authenticate, 
  authorize('admin'), 
  reportController.getRetailerReport
);

router.get('/retailers/export', 
  authenticate, 
  authorize('admin'), 
  reportController.exportRetailerReport
);

// Quotation Reports
router.get('/quotations', 
  authenticate, 
  authorize('admin', 'store'), 
  reportController.getQuotationReport
);

router.get('/quotations/export', 
  authenticate, 
  authorize('admin', 'store'), 
  reportController.exportQuotationReport
);

export default router;