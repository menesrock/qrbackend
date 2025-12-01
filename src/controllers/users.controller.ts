import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import bcrypt from 'bcrypt';
import { sanitizeUser } from '../utils/transformers';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: users.map(sanitizeUser),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role, permissions } = req.body;

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        permissions: permissions || [],
        isOnline: false,
      },
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is updating themselves or is admin
    const isSelfUpdate = currentUser.id === id;
    const isAdmin = currentUser.role === 'admin';

    if (!isSelfUpdate && !isAdmin) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const updateData: any = {};

    // Admin can update all fields
    if (isAdmin) {
      if (data.email) updateData.email = data.email;
      if (data.role) updateData.role = data.role;
      if (data.permissions) updateData.permissions = data.permissions;
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
    }

    // All authenticated users can update their online status
    if (data.isOnline !== undefined) {
      updateData.isOnline = data.isOnline;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
