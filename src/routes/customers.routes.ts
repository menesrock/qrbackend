import { Router } from 'express';
import { getCustomers, getCustomer, createOrUpdateCustomer } from '../controllers/customers.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public route - customers can create/update themselves
router.post('/', createOrUpdateCustomer);

// Admin only routes
router.get('/', authenticate, authorize('admin'), getCustomers);
router.get('/:id', authenticate, authorize('admin'), getCustomer);

export default router;

