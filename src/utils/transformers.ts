// Data transformation utilities between database and API models

import { User, MenuItem, Order, Table, Settings, Customization } from '../types/models';

/**
 * Remove password from user object
 */
export const sanitizeUser = (user: User): Omit<User, 'password'> => {
  const { password, ...sanitized } = user;
  return sanitized;
};

/**
 * Convert database dates to ISO strings for API response
 */
export const serializeMenuItem = (item: MenuItem & { customizations?: Customization[] }) => ({
    ...item,
    price: Number(item.price),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  customizations: item.customizations?.map((customization) => ({
    ...customization,
    options: customization.options,
  })),
});

export const serializeOrder = (order: Order & { items?: any[] }) => {
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    claimedAt: order.claimedAt?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
    confirmedAt: order.confirmedAt?.toISOString() || null,
    readyAt: order.readyAt?.toISOString() || null,
    completedAt: order.completedAt?.toISOString() || null,
    updatedAt: order.updatedAt.toISOString(),
    items: order.items?.map((item) => ({
      ...item,
      basePrice: Number(item.basePrice),
      itemTotal: Number(item.itemTotal),
    })),
  };
};

export const serializeTable = (table: Table) => {
  return {
    ...table,
    occupiedSince: table.occupiedSince?.toISOString() || null,
    createdAt: table.createdAt.toISOString(),
    updatedAt: table.updatedAt.toISOString(),
    currentOccupants: Array.isArray(table.currentOccupants) 
      ? table.currentOccupants 
      : (table.currentOccupants ? [table.currentOccupants] : []),
  };
};

export const serializeSettings = (settings: Settings) => ({
    ...settings,
  menuCategories: settings.menuCategories ?? [],
    updatedAt: settings.updatedAt.toISOString(),
});

/**
 * Calculate order item total
 */
export const calculateItemTotal = (
  basePrice: number,
  quantity: number,
  customizations: { price: number }[]
): number => {
  const customizationTotal = customizations.reduce((sum, c) => sum + c.price, 0);
  return (basePrice + customizationTotal) * quantity;
};

/**
 * Calculate order total
 */
export const calculateOrderTotal = (
  items: { basePrice: number; quantity: number; customizations: { price: number }[] }[]
): number => {
  return items.reduce((sum, item) => {
    return sum + calculateItemTotal(item.basePrice, item.quantity, item.customizations);
  }, 0);
};
