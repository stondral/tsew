
/* USER (LIGHTWEIGHT REFERENCE) */
export interface OrderUser {
  id: string;
  email?: string;
}

/* PRODUCT SNAPSHOT (IMMUTABLE) */
export interface OrderedProductSnapshot {
  id: string;
  name: string;
  sku: string;
  image?: string;
}

/* VARIANT SNAPSHOT (OPTIONAL) */
export interface OrderedVariantSnapshot {
  id: string;
  name: string;
  sku: string;
}

/* ORDER ITEM */
export interface OrderItem {
  product: OrderedProductSnapshot;
  variant?: OrderedVariantSnapshot | null;
  quantity: number;
  price: number; // price PER UNIT at time of order
}

/* SHIPPING ADDRESS */
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/* PAYMENT */
export type PaymentMethod = "cod" | "razorpay";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

/* ORDER STATUS */
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/* ORDER */
export interface Order {
  id: string;
  orderNumber: string;

  user: OrderUser | string;

  items: OrderItem[];

  shippingAddress: ShippingAddress;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  subtotal: number;
  shippingCost: number;
  tax: number;
  platformFee?: number;
  total: number;

  status: OrderStatus;

  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  notes?: string;

  orderDate?: string | Date;
  shippedDate?: string | Date;
  deliveredDate?: string | Date;

  createdAt: string;
}

/* PAYMENT DETAILS (CLIENT SIDE) */
export interface PaymentDetails {
  method: PaymentMethod;
}
