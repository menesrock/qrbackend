import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((val) => val.trim().length >= 8, {
      message: 'Password must contain at least 8 non-whitespace characters',
    }),
  role: z.string().min(1, 'Role is required'),
  permissions: z.array(z.string()).optional(),
});

// Menu item validation schemas
export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  nameTranslations: z.record(z.string()).optional(),
  description: z.string().max(1000).optional().default(''),
  descriptionTranslations: z.record(z.string()).optional(),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  imageUrl: z.string().optional().nullable().refine(
    (val) => !val || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Image URL must be a valid URL or relative path' }
  ),
  isPopular: z.boolean().optional().default(false),
  popularRank: z.number().int().positive().optional().nullable(),
  displayOrder: z.number().int().nonnegative().optional().nullable(),
  nutritionalInfo: z
    .object({
      calories: z.number().nonnegative(),
      protein: z.number().nonnegative(),
      carbs: z.number().nonnegative(),
      fat: z.number().nonnegative(),
    })
    .optional()
    .nullable(),
  allergens: z.array(z.string()).optional().default([]),
});

// Order validation schemas
export const createOrderSchema = z.object({
  tableId: z.string().uuid(),
  tableName: z.string().min(1),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  items: z
    .array(
      z.object({
        menuItemId: z.string().uuid(),
        menuItemName: z.string(),
        quantity: z.number().int().positive(),
        basePrice: z.number().nonnegative(),
        customizations: z.array(
          z.object({
            customizationId: z.string(),
            name: z.string().optional(),
            type: z.string().optional(),
            selectedOptions: z.array(
              z.object({
                name: z.string(),
                price: z.number().optional(),
              })
            ),
          })
        ),
        customerNotes: z.string().max(500).optional(),
        itemTotal: z.number().nonnegative(),
      })
    )
    .min(1, 'At least one item is required'),
  totalAmount: z.number().nonnegative(),
  orderSource: z.enum(['customer', 'manual']).optional(),
});

// Table validation schemas
export const createTableSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(50),
});

// Call request validation schemas
export const createCallRequestSchema = z.object({
  tableId: z.string().uuid(),
  tableName: z.string().min(1),
  customerName: z.string().min(1).max(100),
  type: z.enum(['bill', 'napkin', 'cleaning']),
});

// Feedback validation schemas
export const createFeedbackSchema = z.object({
  tableId: z.string().uuid(),
  orderId: z.string().uuid(),
  serviceRating: z.number().int().min(1).max(5),
  hygieneRating: z.number().int().min(1).max(5),
  productRating: z.number().int().min(1).max(5),
  overallRating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  mentionedProducts: z.array(z.string().uuid()).optional(),
});

// Settings validation schemas
export const updateSettingsSchema = z.object({
  logo: z.string().optional().nullable().refine(
    (val) => !val || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Logo must be a valid URL or path' }
  ),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  restaurantName: z.string().min(1).max(100).optional(),
  customerMenuBaseUrl: z.string().optional().nullable().refine(
    (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Customer menu base URL must be a valid URL' }
  ),
  menuCategories: z.array(z.string().min(1)).optional(),
  crossSellRules: z.record(z.array(z.string().min(1))).optional(),
});

// Helper function to validate request body
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// Helper function for property testing
export const validateUserCreation = (data: any): { success: boolean; error?: any } => {
  try {
    createUserSchema.parse(data);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};
