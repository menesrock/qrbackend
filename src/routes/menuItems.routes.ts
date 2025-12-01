import { Router } from 'express';
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuItems.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createMenuItemSchema } from '../utils/validation';

const router = Router();

// Public routes
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);

// Admin only routes
router.post('/', authenticate, authorize('admin'), validate(createMenuItemSchema), createMenuItem);
router.put('/:id', authenticate, authorize('admin'), updateMenuItem);
router.delete('/:id', authenticate, authorize('admin'), deleteMenuItem);

export default router;
