import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { serializeOrder } from '../utils/transformers';
import { io } from '../server';
import { updateCustomerSpending } from './customers.controller';

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { status, tableId } = req.query;

    const where: any = {};
    
    // Support multiple status values (comma-separated)
    if (status) {
      const statusArray = String(status).split(',');
      if (statusArray.length === 1) {
        where.status = statusArray[0].trim();
      } else {
        where.status = { in: statusArray.map(s => s.trim()) };
      }
    }
    
    if (tableId) where.tableId = tableId as string;

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: orders.map(serializeOrder),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    // Find customer by email if provided
    let customerId = null;
    if (data.customerEmail) {
      const customer = await prisma.customer.findUnique({
        where: { email: data.customerEmail },
      });
      if (customer) {
        customerId = customer.id;
      }
    }

    const order = await prisma.order.create({
      data: {
        tableId: data.tableId,
        tableName: data.tableName,
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerId: customerId,
        status: 'pending',
        totalAmount: data.totalAmount,
        orderSource: data.orderSource || 'customer',
        items: {
          create: data.items.map((item: any) => ({
            menuItemId: item.menuItemId,
            menuItemName: item.menuItemName,
            quantity: item.quantity,
            basePrice: item.basePrice,
            customizations: item.customizations,
            customerNotes: item.customerNotes || null,
            itemTotal: item.itemTotal,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update table status to occupied
    await prisma.table.update({
      where: { id: data.tableId },
      data: {
        status: 'occupied',
        occupiedSince: new Date(),
        currentOccupants: [{
          name: data.customerName,
          joinedAt: new Date().toISOString(),
        }],
      },
    });

    // Broadcast new order to waiters
    io.emit('order:new', serializeOrder(order));

    res.status(201).json(serializeOrder(order));
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, queuePosition } = req.body;

    const updateData: any = { status };

    if (status === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (status === 'ready') {
      updateData.readyAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    if (queuePosition !== undefined) {
      updateData.queuePosition = queuePosition;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: true,
      },
    });

    // If order is completed, update customer spending
    if (status === 'completed' && order.customerEmail) {
      await updateCustomerSpending(order.customerEmail, Number(order.totalAmount));
    }

    // Broadcast order update
    io.emit('order:updated', serializeOrder(order));

    // If confirmed, notify chefs
    if (status === 'confirmed') {
      io.emit('order:confirmed', serializeOrder(order));
    }

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

export const claimOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        claimedBy: userId,
        claimedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    // Broadcast claim
    io.emit('order:claimed', serializeOrder(order));

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Claim order error:', error);
    res.status(500).json({ error: 'Failed to claim order' });
  }
};

export const releaseOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.update({
      where: { id },
      data: {
        claimedBy: null,
        claimedAt: null,
      },
      include: {
        items: true,
      },
    });

    // Broadcast release
    io.emit('order:released', serializeOrder(order));

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Release order error:', error);
    res.status(500).json({ error: 'Failed to release order' });
  }
};

export const addItemsToOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { items, additionalAmount } = req.body;

    // Add new items to order
    await prisma.orderItem.createMany({
      data: items.map((item: any) => ({
        orderId: id,
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName,
        quantity: item.quantity,
        basePrice: item.basePrice,
        customizations: item.customizations,
        customerNotes: item.customerNotes || null,
        itemTotal: item.itemTotal,
      })),
    });

    // Update order total
    const order = await prisma.order.update({
      where: { id },
      data: {
        totalAmount: {
          increment: additionalAmount,
        },
      },
      include: {
        items: true,
      },
    });

    // Broadcast update
    io.emit('order:updated', serializeOrder(order));

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Add items to order error:', error);
    res.status(500).json({ error: 'Failed to add items to order' });
  }
};
