// Central exports for all model types
// This provides a clean import interface for the rest of the application

// Domain Models - Core business entities
export type {
  Product,
  ProductVariant,
  User,
  Order,
  OrderItem,
  ShippingAddress,
  PaymentDetails,
} from './domain';

// API Response Shapes - Raw data from external APIs
export type {
  PayloadProduct,
  PayloadProductResponse,
  PayloadMedia,
  PayloadUser,
  PayloadOrder,
} from './api';

// Client State Models - React state and context types
export type {
  AuthContextType,
  CartItem,
  Cart,
  CartContextType,
  CheckoutState,
  NotificationState,
} from './client-state';
