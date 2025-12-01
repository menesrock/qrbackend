import { Router } from 'express';
import { uploadImage, deleteImage } from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Admin only routes
router.post(
  '/',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  uploadImage
);

router.delete('/:filename', authenticate, authorize('admin'), deleteImage);

export default router;
