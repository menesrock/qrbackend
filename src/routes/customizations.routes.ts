import { Router } from 'express';
import {
  getCustomizations,
  createCustomization,
  updateCustomization,
  deleteCustomization,
  replaceCustomizations,
} from '../controllers/customizations.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.get('/', getCustomizations);
router.post('/', authenticate, authorize('admin'), createCustomization);
router.put('/:id', authenticate, authorize('admin'), updateCustomization);
router.put('/menu-item/:menuItemId', authenticate, authorize('admin'), replaceCustomizations);
router.delete('/:id', authenticate, authorize('admin'), deleteCustomization);

export default router;
