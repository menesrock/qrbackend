import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { io } from '../server';

export const getCallRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, tableId } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (tableId) where.tableId = tableId as string;

    const requests = await prisma.callRequest.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: requests });
  } catch (error) {
    console.error('Get call requests error:', error);
    res.status(500).json({ error: 'Failed to fetch call requests' });
  }
};

export const createCallRequest = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    // Check for duplicate pending request
    const existing = await prisma.callRequest.findFirst({
      where: {
        tableId: data.tableId,
        type: data.type,
        status: 'pending',
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Duplicate request already exists' });
    }

    const request = await prisma.callRequest.create({
      data: {
        tableId: data.tableId,
        tableName: data.tableName,
        customerName: data.customerName,
        type: data.type,
        status: 'pending',
      },
    });

    // Broadcast to waiters
    io.emit('call:new', request);

    res.status(201).json(request);
  } catch (error) {
    console.error('Create call request error:', error);
    res.status(500).json({ error: 'Failed to create call request' });
  }
};

export const claimCallRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if already claimed by someone else
    const existing = await prisma.callRequest.findUnique({
      where: { id },
    });

    if (existing?.claimedBy && existing.claimedBy !== userId) {
      return res.status(400).json({ error: 'Request already claimed by another waiter' });
    }

    const request = await prisma.callRequest.update({
      where: { id },
      data: {
        claimedBy: userId,
        claimedAt: new Date(),
      },
    });

    // Broadcast claim
    io.emit('call:claimed', request);

    res.json(request);
  } catch (error) {
    console.error('Claim call request error:', error);
    res.status(500).json({ error: 'Failed to claim call request' });
  }
};

export const releaseCallRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.callRequest.update({
      where: { id },
      data: {
        claimedBy: null,
        claimedAt: null,
      },
    });

    // Broadcast release
    io.emit('call:released', request);

    res.json(request);
  } catch (error) {
    console.error('Release call request error:', error);
    res.status(500).json({ error: 'Failed to release call request' });
  }
};

export const completeCallRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.callRequest.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        completedBy: req.user?.id,
      },
    });

    // Broadcast completion
    io.emit('call:completed', request);

    res.json(request);
  } catch (error) {
    console.error('Complete call request error:', error);
    res.status(500).json({ error: 'Failed to complete call request' });
  }
};
