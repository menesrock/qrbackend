import { Router } from 'express';
import {
  getCallRequests,
  createCallRequest,
  completeCallRequest,
  claimCallRequest,
  releaseCallRequest,
} from '../controllers/callRequests.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCallRequestSchema } from '../utils/validation';

const router = Router();

// Public route - customers can create requests
router.post('/', validate(createCallRequestSchema), createCallRequest);

// Authenticated routes
router.get('/', authenticate, getCallRequests);
router.post('/:id/claim', authenticate, authorize('admin', 'waiter'), claimCallRequest);
router.post('/:id/release', authenticate, authorize('admin', 'waiter'), releaseCallRequest);
router.put('/:id/complete', authenticate, authorize('admin', 'waiter'), completeCallRequest);

export default router;
