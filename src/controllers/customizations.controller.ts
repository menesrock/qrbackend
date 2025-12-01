import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../server';

export const getCustomizations = async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.query;
    const where = menuItemId ? { menuItemId: menuItemId as string } : {};
    const customizations = await prisma.customization.findMany({ where });
    res.json({ data: customizations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customizations' });
  }
};

export const createCustomization = async (req: AuthRequest, res: Response) => {
  try {
    const customization = await prisma.customization.create({ data: req.body });
    res.status(201).json(customization);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customization' });
  }
};

export const updateCustomization = async (req: AuthRequest, res: Response) => {
  try {
    const customization = await prisma.customization.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(customization);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customization' });
  }
};

export const deleteCustomization = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.customization.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete customization' });
  }
};

export const replaceCustomizations = async (req: AuthRequest, res: Response) => {
  try {
    const { menuItemId } = req.params;
    const { customizations } = req.body;
    console.log('Replace customizations request:', { menuItemId, customizationsCount: customizations?.length || 0 });

    await prisma.$transaction([
      prisma.customization.deleteMany({ where: { menuItemId } }),
      ...(customizations && customizations.length
        ? [
            prisma.customization.createMany({
              data: customizations.map((c: any) => ({
                ...(c.id && !String(c.id).startsWith('tmp-') ? { id: c.id } : {}),
                menuItemId,
                type: c.type,
                name: c.name,
                options: c.options,
                allowMultiple: c.allowMultiple ?? false,
                required: c.required ?? false,
              })),
            }),
          ]
        : []),
    ]);

    const next = await prisma.customization.findMany({ where: { menuItemId } });
    console.log('Customizations replaced successfully:', next.length);
    res.json({ data: next });
  } catch (error) {
    console.error('Replace customizations error:', error);
    res.status(500).json({ error: 'Failed to save customizations' });
  }
};
