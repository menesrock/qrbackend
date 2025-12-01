// Data transformation utilities between database and API models

import { User, MenuItem, Order, Table, Settings, Customization, TableOccupant } from '../types/models';

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
export const serializeMenuItem = (item: any) => {
  const menuItem = item as MenuItem & { customizations?: Customization[] };
  return {
    ...menuItem,
    nameTranslations: (menuItem.nameTranslations as any) || {},
    descriptionTranslations: (menuItem.descriptionTranslations as any) || {},
    price: Number(menuItem.price),
    createdAt: menuItem.createdAt instanceof Date ? menuItem.createdAt.toISOString() : menuItem.createdAt,
    updatedAt: menuItem.updatedAt instanceof Date ? menuItem.updatedAt.toISOString() : menuItem.updatedAt,
    customizations: menuItem.customizations?.map((customization) => ({
      ...customization,
      options: customization.options,
    })),
  };
};

export const serializeOrder = (order: any) => {
  const orderData = order as Order & { items?: any[] };
  return {
    ...orderData,
    totalAmount: Number(orderData.totalAmount),
    claimedAt: orderData.claimedAt instanceof Date ? orderData.claimedAt.toISOString() : (orderData.claimedAt || null),
    createdAt: orderData.createdAt instanceof Date ? orderData.createdAt.toISOString() : orderData.createdAt,
    confirmedAt: orderData.confirmedAt instanceof Date ? orderData.confirmedAt.toISOString() : (orderData.confirmedAt || null),
    readyAt: orderData.readyAt instanceof Date ? orderData.readyAt.toISOString() : (orderData.readyAt || null),
    completedAt: orderData.completedAt instanceof Date ? orderData.completedAt.toISOString() : (orderData.completedAt || null),
    updatedAt: orderData.updatedAt instanceof Date ? orderData.updatedAt.toISOString() : orderData.updatedAt,
    items: orderData.items?.map((item) => ({
      ...item,
      basePrice: Number(item.basePrice),
      itemTotal: Number(item.itemTotal),
    })),
  };
};

export const serializeTable = (table: any) => {
  const tableData = table as Table;
  const occupants = tableData.currentOccupants;
  let parsedOccupants: TableOccupant[] | null = null;
  
  if (occupants) {
    if (Array.isArray(occupants)) {
      parsedOccupants = occupants as TableOccupant[];
    } else if (typeof occupants === 'string') {
      try {
        parsedOccupants = JSON.parse(occupants) as TableOccupant[];
      } catch {
        parsedOccupants = null;
      }
    } else {
      parsedOccupants = occupants as TableOccupant[];
    }
  }
  
  return {
    ...tableData,
    occupiedSince: tableData.occupiedSince instanceof Date ? tableData.occupiedSince.toISOString() : (tableData.occupiedSince || null),
    createdAt: tableData.createdAt instanceof Date ? tableData.createdAt.toISOString() : tableData.createdAt,
    updatedAt: tableData.updatedAt instanceof Date ? tableData.updatedAt.toISOString() : tableData.updatedAt,
    currentOccupants: parsedOccupants || [],
  };
};

export const serializeSettings = (settings: any) => {
  const settingsData = settings as Settings;
  let menuCategories: string[] | null = null;
  
  if (settingsData.menuCategories) {
    if (Array.isArray(settingsData.menuCategories)) {
      menuCategories = settingsData.menuCategories as string[];
    } else if (typeof settingsData.menuCategories === 'string') {
      try {
        menuCategories = JSON.parse(settingsData.menuCategories) as string[];
      } catch {
        menuCategories = null;
      }
    }
  }
  
  return {
    ...settingsData,
    menuCategories: menuCategories ?? [],
    updatedAt: settingsData.updatedAt instanceof Date ? settingsData.updatedAt.toISOString() : settingsData.updatedAt,
  };
};

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
