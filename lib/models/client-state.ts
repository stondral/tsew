// Client State Models - React state and context types
// These represent the shape of client-side state management

import { Product } from './domain/product';
import { ShippingAddress, PaymentDetails } from './domain/order';
import { User } from './domain/user';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string | null;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, quantity?: number, variantId?: string | null) => void;
  removeFromCart: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isLoading: boolean;
}

export interface CheckoutState {
  shippingAddress: ShippingAddress | null;
  paymentDetails: PaymentDetails | null;
  isProcessing: boolean;
  error: string | null;
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
}
