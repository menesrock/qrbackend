// API request and response types

// Common
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<import('./models').User, 'password'>;
  message: string;
}

// Menu Items
export interface CreateMenuItemRequest {
  name: string;
  nameTranslations?: Record<string, string>;
  description: string;
  descriptionTranslations?: Record<string, string>;
  price: number;
  category: string;
  imageUrl?: string;
  isPopular?: boolean;
  popularRank?: number;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  allergens?: string[];
}

export interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {}

// Orders
export interface CreateOrderRequest {
  tableId: string;
  tableName: string;
  customerName: string;
  items: {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    basePrice: number;
    customizations: {
      customizationId: string;
      selectedOptions: string[];
    }[];
    customerNotes?: string;
    itemTotal: number;
  }[];
  totalAmount: number;
  orderSource?: 'customer' | 'manual';
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed';
  queuePosition?: number;
}

// Tables
export interface CreateTableRequest {
  name: string;
}

export interface UpdateTableRequest {
  name?: string;
  status?: 'available' | 'occupied';
  occupiedSince?: string | null;
  currentOccupants?: {
    name: string;
    joinedAt: string;
  }[] | null;
}

// Call Requests
export interface CreateCallRequestRequest {
  tableId: string;
  tableName: string;
  customerName: string;
  type: 'bill' | 'napkin' | 'cleaning';
}

// Users
export interface CreateUserRequest {
  email: string;
  password: string;
  role: string;
  permissions?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: string;
  permissions?: string[];
  isOnline?: boolean;
}

// Settings
export interface UpdateSettingsRequest {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  restaurantName?: string;
}

// Feedback
export interface CreateFeedbackRequest {
  tableId: string;
  orderId: string;
  serviceRating: number;
  hygieneRating: number;
  productRating: number;
  overallRating: number;
  comment?: string;
  mentionedProducts?: string[];
}

// Push Notifications
export interface SubscribePushRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
