import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { Prisma } from '@prisma/client';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, sortBy = 'lastVisitAt', sortOrder = 'desc', page = '1', limit = '50' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.CustomerWhereInput = {};
    
    if (search) {
      where.email = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (sortBy === 'totalSpent') {
      orderBy.totalSpent = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'visitCount') {
      orderBy.visitCount = sortOrder === 'asc' ? 'asc' : 'desc';
    } else if (sortBy === 'lastVisitAt') {
      orderBy.lastVisitAt = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = sortOrder === 'asc' ? 'asc' : 'desc';
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          _count: {
            select: { orders: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      data: customers.map(c => ({
        ...c,
        totalSpent: Number(c.totalSpent),
        orderCount: c._count.orders,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

export const getCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              take: 5,
            },
          },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      ...customer,
      totalSpent: Number(customer.totalSpent),
      orderCount: customer._count.orders,
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

export const createOrUpdateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { email, emailConsent } = req.body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if customer exists
    const existing = await prisma.customer.findUnique({
      where: { email },
    });

    if (existing) {
      // Update existing customer
      const updated = await prisma.customer.update({
        where: { email },
        data: {
          emailConsent: emailConsent ?? existing.emailConsent,
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
        },
      });

      res.json({
        ...updated,
        totalSpent: Number(updated.totalSpent),
      });
    } else {
      // Create new customer
      const created = await prisma.customer.create({
        data: {
          email,
          emailConsent: emailConsent ?? false,
          visitCount: 1,
          lastVisitAt: new Date(),
        },
      });

      res.json({
        ...created,
        totalSpent: Number(created.totalSpent),
      });
    }
  } catch (error) {
    console.error('Create/update customer error:', error);
    res.status(500).json({ error: 'Failed to create/update customer' });
  }
};

export const updateCustomerSpending = async (customerEmail: string, amount: number) => {
  try {
    if (!customerEmail) return;

    await prisma.customer.updateMany({
      where: { email: customerEmail },
      data: {
        totalSpent: { increment: amount },
      },
    });
  } catch (error) {
    console.error('Update customer spending error:', error);
  }
};

