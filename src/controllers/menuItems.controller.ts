import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { serializeMenuItem } from '../utils/transformers';
import { io } from '../server';

export const getMenuItems = async (req: AuthRequest, res: Response) => {
  try {
    const { category, isActive, isPopular } = req.query;

    const where: any = {};
    if (category) where.category = category as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (isPopular !== undefined) where.isPopular = isPopular === 'true';

    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy: [
        { isPopular: 'desc' },
        { displayOrder: 'asc' },
        { popularRank: 'asc' },
        { name: 'asc' },
      ],
      include: {
        customizations: true,
      },
    });

    console.log(`Get menu items: found ${menuItems.length} items`, menuItems.map(m => ({ id: m.id, name: m.name, category: m.category })));

    res.json({
      data: menuItems.map(serializeMenuItem),
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

export const getMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        customizations: true,
      },
    });

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(serializeMenuItem(menuItem));
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
};

export const createMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    console.log('Create menu item request:', data);

    // Process imageUrl: trim, validate if provided, set to null if empty
    let imageUrl: string | null = null;
    if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '') {
      const trimmed = data.imageUrl.trim();
      // Accept relative paths (starting with /) or absolute URLs
      if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        imageUrl = trimmed;
      } else {
        return res.status(400).json({
          error: 'Validation failed',
          details: [{ path: 'imageUrl', message: 'Image URL must be a valid URL or relative path (starting with /)' }],
        });
      }
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        nameTranslations: data.nameTranslations || {},
        description: data.description,
        descriptionTranslations: data.descriptionTranslations || {},
        price: data.price,
        category: data.category,
        imageUrl,
        isPopular: data.isPopular || false,
        popularRank: data.popularRank || null,
        displayOrder: data.displayOrder ?? null,
        isActive: true,
        nutritionalInfo: data.nutritionalInfo || null,
        allergens: data.allergens || [],
      },
    });

    console.log('Menu item created:', menuItem.id, menuItem.name);

    // Broadcast update via WebSocket
    io.emit('menu:updated', { action: 'create', item: serializeMenuItem(menuItem) });

    res.status(201).json(serializeMenuItem(menuItem));
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Process imageUrl: validate if provided
    let imageUrl: string | null | undefined = undefined;
    if (data.imageUrl !== undefined) {
      if (data.imageUrl === null || data.imageUrl === '') {
        imageUrl = null;
      } else if (typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '') {
        const trimmed = data.imageUrl.trim();
        // Accept relative paths (starting with /) or absolute URLs
        if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          imageUrl = trimmed;
        } else {
          return res.status(400).json({
            error: 'Validation failed',
            details: [{ path: 'imageUrl', message: 'Image URL must be a valid URL or relative path (starting with /)' }],
          });
        }
      }
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.nameTranslations && { nameTranslations: data.nameTranslations }),
        ...(data.description && { description: data.description }),
        ...(data.descriptionTranslations && {
          descriptionTranslations: data.descriptionTranslations,
        }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.category && { category: data.category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(data.isPopular !== undefined && { isPopular: data.isPopular }),
        ...(data.popularRank !== undefined && { popularRank: data.popularRank }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.nutritionalInfo !== undefined && { nutritionalInfo: data.nutritionalInfo }),
        ...(data.allergens && { allergens: data.allergens }),
      },
    });

    // Broadcast update via WebSocket
    io.emit('menu:updated', { action: 'update', item: serializeMenuItem(menuItem) });

    res.json(serializeMenuItem(menuItem));
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.menuItem.delete({
      where: { id },
    });

    // Broadcast update via WebSocket
    io.emit('menu:updated', { action: 'delete', itemId: id });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};
