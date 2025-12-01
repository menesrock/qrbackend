import { Router } from 'express';
import {
  getTables,
  getTable,
  createTable,
  updateTable,
  deleteTable,
  generateQRCode,
  regenerateAllQRCodes,
} from '../controllers/tables.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTableSchema } from '../utils/validation';

const router = Router();

// Public routes
router.get('/', getTables);
router.get('/:id', getTable);
router.get('/:id/qr', generateQRCode);

// Admin/Waiter routes
router.post('/', authenticate, authorize('admin'), validate(createTableSchema), createTable);
router.put('/:id', authenticate, authorize('admin', 'waiter'), updateTable);
router.delete('/:id', authenticate, authorize('admin'), deleteTable);
router.post('/regenerate-qr-codes', authenticate, authorize('admin'), regenerateAllQRCodes);

export default router;
