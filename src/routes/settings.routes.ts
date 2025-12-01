import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateSettingsSchema } from '../utils/validation';

const router = Router();

// Public route
router.get('/', getSettings);

// Admin only
router.put('/', authenticate, authorize('admin'), validate(updateSettingsSchema), updateSettings);

export default router;
