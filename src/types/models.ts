// Type definitions matching Prisma schema

export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  isOnline: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  description: string;
  descriptionTranslations: Record<string, string>;
  price: number;
  category: string;
  imageUrl: string | null;
  isPopular: boolean;
  popularRank: number | null;
  displayOrder: number | null;
  isActive: boolean;
  nutritionalInfo: NutritionalInfo | null;
  allergens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Customization {
  id: string;
  menuItemId: string;
  type: string;
  name: string;
  options: CustomizationOption[];
  allowMultiple: boolean;
  required: boolean;
}

export interface CustomizationOption {
  name: string;
  price: number;
  isDefault: boolean;
}

export interface Table {
  id: string;
  name: string;
  qrCodeUrl: string;
  status: string;
  occupiedSince: Date | null;
  currentOccupants: TableOccupant[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TableOccupant {
  name: string;
  joinedAt: string;
}

export interface Order {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  status: string;
  queuePosition: number | null;
  totalAmount: number;
  orderSource: string;
  claimedBy: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  confirmedAt: Date | null;
  readyAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  basePrice: number;
  customizations: OrderItemCustomization[];
  customerNotes: string | null;
  itemTotal: number;
}

export interface OrderItemCustomization {
  customizationId: string;
  name?: string;
  type?: string;
  selectedOptions: { name: string; price?: number }[];
}

export interface CallRequest {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  type: string;
  status: string;
  claimedBy: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  completedAt: Date | null;
  completedBy: string | null;
}

export interface Feedback {
  id: string;
  tableId: string;
  orderId: string;
  serviceRating: number;
  hygieneRating: number;
  productRating: number;
  overallRating: number;
  comment: string | null;
  mentionedProducts: string[];
  createdAt: Date;
}

export interface Settings {
  id: string;
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  restaurantName: string;
  customerMenuBaseUrl: string | null;
  menuCategories: string[] | null;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: Date;
}
