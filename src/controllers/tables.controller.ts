import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { serializeTable } from '../utils/transformers';
import QRCode from 'qrcode';
import { config } from '../config';
import { io } from '../server';

export const getTables = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status as string;

    const tables = await prisma.table.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      data: tables.map(serializeTable),
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
};

export const getTable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(serializeTable(table));
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
};

const buildTableUrl = async (table: { id: string; name: string }) => {
  const settings = await prisma.settings.findUnique({
    where: { id: 'branding' },
    select: { customerMenuBaseUrl: true },
  });

  const fallback = `http://${config.app.domain}`;
  let base =
    settings?.customerMenuBaseUrl?.trim()?.replace(/\/$/, '') ||
    fallback.replace(/\/$/, '');

  // Force HTTP for localhost (development)
  if (base.includes('localhost') || base.includes('127.0.0.1')) {
    base = base.replace(/^https?:\/\//, 'http://');
  }

  const slug = encodeURIComponent(table.name);
  return `${base}/table/${slug}?tableId=${table.id}`;
};

export const createTable = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    // Check if table name already exists
    const existing = await prisma.table.findUnique({
      where: { name },
    });

    if (existing) {
      return res.status(400).json({ error: 'Table name already exists' });
    }

    // Create table first to get ID
    const table = await prisma.table.create({
      data: {
        name,
        qrCodeUrl: '', // Will update after generating QR code
        status: 'available',
      },
    });

    // Generate QR code URL
    const tableUrl = await buildTableUrl(table);
    const qrCodeDataUrl = await QRCode.toDataURL(tableUrl);

    // Update table with QR code URL
    const updatedTable = await prisma.table.update({
      where: { id: table.id },
      data: { qrCodeUrl: qrCodeDataUrl },
    });

    res.status(201).json(serializeTable(updatedTable));
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
};

export const updateTable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Get current table to check if name changed
    const currentTable = await prisma.table.findUnique({
      where: { id },
    });

    if (!currentTable) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.status) updateData.status = data.status;
    
    // Handle occupiedSince - can be Date, string, or ISO string
    if (data.occupiedSince !== undefined) {
      if (typeof data.occupiedSince === 'string') {
        updateData.occupiedSince = new Date(data.occupiedSince);
      } else if (data.occupiedSince instanceof Date) {
        updateData.occupiedSince = data.occupiedSince;
      }
    }
    
    // Handle currentOccupants - ensure it's an array
    if (data.currentOccupants !== undefined) {
      // If it's already an array, use it; if it's a single object, wrap it in an array
      if (Array.isArray(data.currentOccupants)) {
        updateData.currentOccupants = data.currentOccupants;
      } else if (typeof data.currentOccupants === 'object' && data.currentOccupants !== null) {
        updateData.currentOccupants = [data.currentOccupants];
      } else {
        updateData.currentOccupants = data.currentOccupants;
      }
    }

    // Update table
    const table = await prisma.table.update({
      where: { id },
      data: updateData,
    });

    // Regenerate QR code if name changed
    if (data.name && data.name !== currentTable.name) {
      const tableUrl = await buildTableUrl(table);
      const qrCodeDataUrl = await QRCode.toDataURL(tableUrl);
      const updatedTable = await prisma.table.update({
        where: { id },
        data: { qrCodeUrl: qrCodeDataUrl },
      });
      
      // Broadcast table update
      io.emit('table:updated', serializeTable(updatedTable));
      return res.json(serializeTable(updatedTable));
    }

    // Broadcast table update
    io.emit('table:updated', serializeTable(table));

    res.json(serializeTable(table));
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
};

export const deleteTable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.table.delete({
      where: { id },
    });

    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
};

export const generateQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { format = 'png' } = req.query;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const tableUrl = await buildTableUrl(table);

    if (format === 'svg') {
      const qrSvg = await QRCode.toString(tableUrl, { type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(qrSvg);
    } else {
      const qrBuffer = await QRCode.toBuffer(tableUrl, { type: 'png' });
      res.setHeader('Content-Type', 'image/png');
      res.send(qrBuffer);
    }
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

export const regenerateAllQRCodes = async (req: AuthRequest, res: Response) => {
  try {
    const tables = await prisma.table.findMany();

    const updates = await Promise.all(
      tables.map(async (table) => {
        const tableUrl = await buildTableUrl(table);
        const qrCodeDataUrl = await QRCode.toDataURL(tableUrl);
        return prisma.table.update({
          where: { id: table.id },
          data: { qrCodeUrl: qrCodeDataUrl },
        });
      })
    );

    res.json({
      message: `Successfully regenerated QR codes for ${updates.length} tables`,
      tables: updates.map(serializeTable),
    });
  } catch (error) {
    console.error('Regenerate all QR codes error:', error);
    res.status(500).json({ error: 'Failed to regenerate QR codes' });
  }
};
