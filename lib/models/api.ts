// API Response Shapes - Raw data from external APIs
// These represent the structure of data coming from Payload CMS and other APIs

export interface PayloadProduct {
  id: string;
  name: string;
  basePrice?: number;
  price?: number;
  compareAtPrice?: number;
  sku: string;
  stock?: number;
  popularity?: number;
  isActive: boolean;
  status: string;
  refundPolicy: string;
  description: string;
  category?: {
    name: string;
  };
  media?: Array<{
    url: string;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    image?: {
      url: string;
    };
    attributes?: Array<{
      name: string;
      value: string;
    }>;
  }>;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PayloadProductResponse {
  docs: PayloadProduct[];
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PayloadMedia {
  url: string;
}

export interface PayloadUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface PayloadOrder {
  id: string;
  orderNumber: string;
  user: string | PayloadUser;
  items: unknown[]; // Raw order items from API
  shippingAddress: unknown; // Raw address from API
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  status: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  platformFee?: number;
  notes?: string;
  orderDate?: string;
  shippedDate?: string;
  deliveredDate?: string;
  createdAt: string;
}
