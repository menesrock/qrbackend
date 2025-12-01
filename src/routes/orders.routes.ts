import { Router } from 'express';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  addItemsToOrder,
  claimOrder,
  releaseOrder,
} from '../controllers/orders.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema } from '../utils/validation';

const router = Router();

// Public route - customers can create orders
router.post('/', validate(createOrderSchema), createOrder);

// Authenticated routes
router.get('/', authenticate, getOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authenticate, authorize('admin', 'waiter', 'chef'), updateOrderStatus);
router.post('/:id/items', addItemsToOrder);
router.post('/:id/claim', authenticate, authorize('admin', 'waiter'), claimOrder);
router.post('/:id/release', authenticate, authorize('admin', 'waiter'), releaseOrder);

export default router;
