import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema } from '../utils/validation';

const router = Router();

// Get users - admin only
router.get('/', authenticate, authorize('admin'), getUsers);

// Create user - admin only
router.post('/', authenticate, authorize('admin'), validate(createUserSchema), createUser);

// Update user - admin can update anyone, users can update only themselves (limited fields)
router.put('/:id', authenticate, updateUser);

// Delete user - admin only
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
