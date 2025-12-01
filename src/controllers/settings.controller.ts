import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';
import { serializeSettings } from '../utils/transformers';
import { io } from '../server';
import { DEFAULT_MENU_CATEGORIES } from '../utils/constants';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'branding' },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.settings.create({
        data: {
          id: 'branding',
          primaryColor: '#1A1A1A',
          secondaryColor: '#4A4A4A',
          accentColor: '#9B9B9B',
          restaurantName: 'Restaurant',
          menuCategories: DEFAULT_MENU_CATEGORIES,
        },
      });
    } else if (
      !settings.menuCategories ||
      !Array.isArray(settings.menuCategories) ||
      !settings.menuCategories.length
    ) {
      settings = await prisma.settings.update({
        where: { id: 'branding' },
        data: {
          menuCategories: DEFAULT_MENU_CATEGORIES,
        },
      });
    }

    res.json(serializeSettings(settings));
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;

    const normalizeCategories = (categories?: string[]) => {
      if (!categories) return undefined;
      const sanitized = categories
        .map((cat) => cat?.trim())
        .filter(Boolean) as string[];
      const unique = Array.from(new Set(sanitized));
      return unique.length ? unique : DEFAULT_MENU_CATEGORIES;
    };

    const normalizedCategories = normalizeCategories(data.menuCategories);

    const settings = await prisma.settings.upsert({
      where: { id: 'branding' },
      update: {
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.primaryColor && { primaryColor: data.primaryColor }),
        ...(data.secondaryColor && { secondaryColor: data.secondaryColor }),
        ...(data.accentColor && { accentColor: data.accentColor }),
        ...(data.restaurantName && { restaurantName: data.restaurantName }),
        ...(data.customerMenuBaseUrl !== undefined && { customerMenuBaseUrl: data.customerMenuBaseUrl }),
        ...(normalizedCategories && { menuCategories: normalizedCategories }),
        ...(data.crossSellRules !== undefined && { crossSellRules: data.crossSellRules }),
      },
      create: {
        id: 'branding',
        logo: data.logo || null,
        primaryColor: data.primaryColor || '#1A1A1A',
        secondaryColor: data.secondaryColor || '#4A4A4A',
        accentColor: data.accentColor || '#9B9B9B',
        restaurantName: data.restaurantName || 'Restaurant',
        customerMenuBaseUrl: data.customerMenuBaseUrl || null,
        menuCategories: normalizedCategories || DEFAULT_MENU_CATEGORIES,
        crossSellRules: data.crossSellRules || null,
      },
    });

    // Broadcast settings update
    io.emit('settings:updated', serializeSettings(settings));

    res.json(serializeSettings(settings));
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
